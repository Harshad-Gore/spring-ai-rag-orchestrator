package com.harshad.orchestrator.chat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.harshad.orchestrator.document.DocumentChunk;
import com.harshad.orchestrator.document.DocumentChunkRepository;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

	private static final Logger log = LoggerFactory.getLogger(ChatService.class);

	/** Maximum conversation turns (user+assistant pairs) fed to the LLM. */
	private static final int WINDOW_MESSAGES = 10;
	/** How many recent messages are given to the query condenser. */
	private static final int CONDENSER_CONTEXT = 6;

	private final ChatClient chatClient;
	private final DocumentChunkRepository chunkRepository;
	private final ChatMessageRepository chatMessageRepository;

	public ChatService(
			ChatClient.Builder chatClientBuilder,
			DocumentChunkRepository chunkRepository,
			ChatMessageRepository chatMessageRepository) {
		this.chatClient = chatClientBuilder.build();
		this.chunkRepository = chunkRepository;
		this.chatMessageRepository = chatMessageRepository;
	}

	// ── Public API ───────────────────────────────────────────────────────────

	public List<ChatMessage> getHistory(UUID notebookId) {
		return chatMessageRepository.findByNotebookIdOrderByCreatedAtAsc(notebookId);
	}

	private List<ChatMessage> getRecentHistory(UUID notebookId, int limit) {
		List<ChatMessage> desc = chatMessageRepository.findRecentByNotebookId(
				notebookId, PageRequest.of(0, limit));
		Collections.reverse(desc); // back to chronological order
		return desc;
	}

	/** Non-streaming: used by the classic /ask endpoint */
	public ChatResponse ask(String query, UUID notebookId, String modelOverride, List<UUID> pinnedDocIds) {
		List<ChatMessage> recentHistory = getRecentHistory(notebookId, CONDENSER_CONTEXT);
		String searchQuery = condenseQuery(query, recentHistory);

		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, searchQuery, pinnedDocIds);
		List<String> excludedFileNames = resolveExcludedFileNames(notebookId, pinnedDocIds);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks, excludedFileNames);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);
		String response = spec.call().content();

		saveMessage(notebookId, ChatMessage.Role.ASSISTANT, response, modelUsed);
		return new ChatResponse(response, buildCitations(chunks));
	}

	/** Streaming: returns token-by-token Flux for the /stream endpoint */
	public StreamContext prepareStream(String query, UUID notebookId, String modelOverride, List<UUID> pinnedDocIds) {
		List<ChatMessage> recentHistory = getRecentHistory(notebookId, CONDENSER_CONTEXT);
		String searchQuery = condenseQuery(query, recentHistory);

		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, searchQuery, pinnedDocIds);
		List<String> excludedFileNames = resolveExcludedFileNames(notebookId, pinnedDocIds);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks, excludedFileNames);
		List<Citation> citations = buildCitations(chunks);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);

		StringBuilder fullResponse = new StringBuilder();
		Flux<String> tokenStream = spec.stream().content()
			.doOnNext(fullResponse::append)
			.doOnComplete(() -> saveMessage(notebookId, ChatMessage.Role.ASSISTANT, fullResponse.toString(), modelUsed));

		return new StreamContext(tokenStream, citations);
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	private ChatClient.ChatClientRequestSpec buildSpec(List<Message> messages, String modelOverride) {
		if (modelOverride != null && !modelOverride.isBlank()) {
			Prompt prompt = new Prompt(messages, OpenAiChatOptions.builder().model(modelOverride).build());
			return chatClient.prompt(prompt);
		}
		return chatClient.prompt().messages(messages);
	}

	private String resolveModel(String modelOverride) {
		return (modelOverride != null && !modelOverride.isBlank()) ? modelOverride : "default";
	}

	private List<Message> buildMessageHistory(UUID notebookId, List<DocumentChunk> currentChunks, List<String> excludedFileNames) {
		List<Message> messages = new ArrayList<>();
		messages.add(new SystemMessage(buildSystemPrompt(currentChunks, excludedFileNames)));

		// Sliding window — last WINDOW_MESSAGES rows, oldest-first
		List<ChatMessage> history = getRecentHistory(notebookId, WINDOW_MESSAGES);
		for (ChatMessage msg : history) {
			if (msg.getRole() == ChatMessage.Role.USER) {
				messages.add(new UserMessage(msg.getContent()));
			} else {
				messages.add(new AssistantMessage(msg.getContent()));
			}
		}
		return messages;
	}

	/**
	 * Returns file names of documents in this notebook that are NOT pinned.
	 * Used to explicitly tell the LLM to ignore them even if they appear in history.
	 */
	private List<String> resolveExcludedFileNames(UUID notebookId, List<UUID> pinnedDocIds) {
		if (pinnedDocIds == null || pinnedDocIds.isEmpty()) return List.of();
		return chunkRepository.findByNotebookId(notebookId).stream()
				.filter(c -> !pinnedDocIds.contains(c.getDocumentId()))
				.map(DocumentChunk::getFileName)
				.distinct()
				.toList();
	}



	/**
	 * Rewrites a vague follow-up into a standalone search query using recent history.
	 * Skipped entirely on the first message. Each message is capped at 200 chars
	 * so the condenser prompt stays small regardless of conversation length.
	 * Runs via CompletableFuture so it doesn't block the server thread.
	 */
	private String condenseQuery(String rawQuery, List<ChatMessage> recentHistory) {
		if (recentHistory.isEmpty()) return rawQuery;
		try {
			String historyText = recentHistory.stream()
					.map(m -> {
						String c = m.getContent();
						return m.getRole().name() + ": " + (c.length() > 200 ? c.substring(0, 200) : c);
					})
					.collect(Collectors.joining("\n"));

			String prompt = """
					Given the conversation history and a follow-up question, rewrite the \
					follow-up into a single self-contained search query. \
					Output ONLY the rewritten query, nothing else.

					History:
					%s

					Follow-up: %s
					Standalone query:""".formatted(historyText, rawQuery);

			String condensed = CompletableFuture.supplyAsync(() ->
				chatClient.prompt()
						.messages(List.of(new UserMessage(prompt)))
						.call()
						.content()
			).get();

			return (condensed != null && !condensed.isBlank()) ? condensed.strip() : rawQuery;
		} catch (Exception e) {
			log.warn("Query condensation failed, falling back to raw query: {}", e.getMessage());
			return rawQuery;
		}
	}

	private List<DocumentChunk> resolveChunks(UUID notebookId, String query, List<UUID> pinnedDocIds) {
		boolean hasPinFilter = pinnedDocIds != null && !pinnedDocIds.isEmpty();

		// Full-text search, then immediately filter to pinned docs only
		List<DocumentChunk> chunks = chunkRepository.searchByNotebookAndQuery(notebookId, query)
				.stream()
				.filter(c -> !hasPinFilter || pinnedDocIds.contains(c.getDocumentId()))
				.toList();

		// Fallback: fetch raw chunks restricted to pinned docs (or all if no filter)
		if (chunks.isEmpty()) {
			chunks = hasPinFilter
					? chunkRepository.findByDocumentIdIn(pinnedDocIds)
					: chunkRepository.findByNotebookId(notebookId);
			if (chunks.size() > 15) chunks = chunks.subList(0, 15);
		}
		return chunks;
	}

	private String buildSystemPrompt(List<DocumentChunk> chunks, List<String> excludedFileNames) {
		String exclusionBlock = "";
		if (!excludedFileNames.isEmpty()) {
			String fileList = excludedFileNames.stream()
					.map(f -> "- " + f)
					.collect(Collectors.joining("\n"));
			exclusionBlock = """

				===== EXCLUDED SOURCES =====
				The following sources have been deactivated by the user and must NOT be used.
				Do not answer questions using content from these sources, even if that content
				appears in the conversation history. If the user asks about them, tell them
				the source is currently excluded and they can re-enable it from the sources panel.

				%s
				===== END EXCLUDED SOURCES =====
				""".formatted(fileList);
		}

		if (chunks.isEmpty()) {
			return """
				You are a knowledgeable research assistant. No documents have been uploaded to this notebook yet.

				Guidelines:
				- You may answer using your general knowledge
				- Clearly indicate that your response is based on general knowledge, not uploaded sources
				- If the user asks you to reference uploaded documents, remind them to upload sources first
				- Be concise but thorough
				- Format your response using markdown where it improves readability (bold, lists, headers)
				""" + exclusionBlock;
		}

		String context = chunks.stream()
			.map(c -> "[Source: " + c.getFileName() + " | Chunk " + c.getChunkIndex() + "]\n" + c.getContent())
			.collect(Collectors.joining("\n\n---\n\n"));

		return """
			You are a knowledgeable research assistant with access to uploaded documents.

			Guidelines:
			- Use the provided document context as your PRIMARY source of information
			- If the documents contain relevant information, cite and prioritize it
			- If the user asks about topics NOT fully covered in the documents, you may supplement with your general knowledge — but clearly indicate when you are going beyond the uploaded sources
			- Be concise but thorough
			- Format your response using markdown where it improves readability (bold, lists, headers)
			- Do NOT repeat source file names in the body of your answer; citations are shown separately

			===== DOCUMENT CONTEXT =====

			""" + context + """

			===== END CONTEXT =====
			""" + exclusionBlock;
	}

	private void saveMessage(UUID notebookId, ChatMessage.Role role, String content, String modelUsed) {
		try {
			chatMessageRepository.save(new ChatMessage(notebookId, role, content, modelUsed));
		} catch (Exception e) {
			log.error("Failed to save chat message for notebook {}: {}", notebookId, e.getMessage());
		}
	}

	private List<Citation> buildCitations(List<DocumentChunk> chunks) {
		Map<String, String> uniqueCitations = new LinkedHashMap<>();
		for (DocumentChunk chunk : chunks) {
			String fileName = chunk.getFileName();
			if (!uniqueCitations.containsKey(fileName)) {
				String excerpt = chunk.getContent();
				if (excerpt.length() > 200) {
					excerpt = excerpt.substring(0, 200) + "...";
				}
				uniqueCitations.put(fileName, excerpt);
			}
		}
		return uniqueCitations.entrySet().stream()
			.map(e -> new Citation(e.getKey(), e.getValue()))
			.limit(5)
			.toList();
	}

	// ── Records ──────────────────────────────────────────────────────────────

	public record ChatRequest(String query, String notebookId, String model, List<String> pinnedDocIds) {}
	public record ChatResponse(String response, List<Citation> citations) {}
	public record Citation(String source, String excerpt) {}
	public record StreamContext(Flux<String> tokenStream, List<Citation> citations) {}
}
