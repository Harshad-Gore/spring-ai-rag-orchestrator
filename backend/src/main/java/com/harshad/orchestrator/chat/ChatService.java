package com.harshad.orchestrator.chat;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
import org.springframework.stereotype.Service;

import com.harshad.orchestrator.document.DocumentChunk;
import com.harshad.orchestrator.document.DocumentChunkRepository;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

	private static final Logger log = LoggerFactory.getLogger(ChatService.class);

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

	/** Non-streaming: used by the classic /ask endpoint */
	public ChatResponse ask(String query, UUID notebookId, String modelOverride) {
		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, query);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);
		String response = spec.call().content();

		saveMessage(notebookId, ChatMessage.Role.ASSISTANT, response, modelUsed);
		return new ChatResponse(response, buildCitations(chunks));
	}

	/** Streaming: returns token-by-token Flux for the /stream endpoint */
	public StreamContext prepareStream(String query, UUID notebookId, String modelOverride) {
		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, query);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks);
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

	private List<Message> buildMessageHistory(UUID notebookId, List<DocumentChunk> currentChunks) {
		List<Message> messages = new ArrayList<>();

		// 1. System message with document context
		messages.add(new SystemMessage(buildSystemPrompt(currentChunks)));

		// 2. Conversation history (including the just-saved user message)
		List<ChatMessage> history = getHistory(notebookId);
		for (ChatMessage msg : history) {
			if (msg.getRole() == ChatMessage.Role.USER) {
				messages.add(new UserMessage(msg.getContent()));
			} else {
				messages.add(new AssistantMessage(msg.getContent()));
			}
		}

		return messages;
	}

	private List<DocumentChunk> resolveChunks(UUID notebookId, String query) {
		List<DocumentChunk> chunks = chunkRepository.searchByNotebookAndQuery(notebookId, query);
		if (chunks.isEmpty()) {
			chunks = chunkRepository.findByNotebookId(notebookId);
			if (chunks.size() > 15) {
				chunks = chunks.subList(0, 15);
			}
		}
		return chunks;
	}

	private String buildSystemPrompt(List<DocumentChunk> chunks) {
		if (chunks.isEmpty()) {
			return """
				You are a knowledgeable research assistant. No documents have been uploaded to this notebook yet.

				Guidelines:
				- You may answer using your general knowledge
				- Clearly indicate that your response is based on general knowledge, not uploaded sources
				- If the user asks you to reference uploaded documents, remind them to upload sources first
				- Be concise but thorough
				- Format your response using markdown where it improves readability (bold, lists, headers)
				""";
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
			""";
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

	public record ChatRequest(String query, String notebookId, String model) {}
	public record ChatResponse(String response, List<Citation> citations) {}
	public record Citation(String source, String excerpt) {}
	public record StreamContext(Flux<String> tokenStream, List<Citation> citations) {}
}
