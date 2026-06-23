package com.harshad.orchestrator.chat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

	// ── Internal Types ───────────────────────────────────────────────────────

	public enum Intent { DOC_SEARCH, CHAT_HISTORY, GENERAL }
	public record QueryAnalysis(Intent intent, String standaloneQuery) {}

	// ── Public API ───────────────────────────────────────────────────────────

	public List<ChatMessage> getHistory(UUID notebookId) {
		return chatMessageRepository.findByNotebookIdOrderByCreatedAtAsc(notebookId);
	}

	public void deleteLastInteraction(UUID notebookId) {
		List<ChatMessage> lastTwo = chatMessageRepository.findRecentByNotebookId(notebookId, PageRequest.of(0, 2));
		if (lastTwo.isEmpty()) return;
		
		if (lastTwo.get(0).getRole() == ChatMessage.Role.ASSISTANT) {
			chatMessageRepository.delete(lastTwo.get(0));
			if (lastTwo.size() > 1 && lastTwo.get(1).getRole() == ChatMessage.Role.USER) {
				chatMessageRepository.delete(lastTwo.get(1));
			}
		}
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
		QueryAnalysis analysis = analyzeIntentAndQuery(query, recentHistory);

		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, analysis, pinnedDocIds);
		List<ChatMessage> recalledMessages = resolvePastMessages(notebookId, analysis, recentHistory);
		List<String> excludedFileNames = resolveExcludedFileNames(notebookId, pinnedDocIds);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks, recalledMessages, excludedFileNames, analysis);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);
		String response = spec.call().content();

		saveMessage(notebookId, ChatMessage.Role.ASSISTANT, response, modelUsed);
		return new ChatResponse(response, buildCitations(chunks));
	}

	/** Streaming: returns token-by-token Flux for the /stream endpoint */
	public StreamContext prepareStream(String query, UUID notebookId, String modelOverride, List<UUID> pinnedDocIds) {
		List<ChatMessage> recentHistory = getRecentHistory(notebookId, CONDENSER_CONTEXT);
		QueryAnalysis analysis = analyzeIntentAndQuery(query, recentHistory);

		saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, analysis, pinnedDocIds);
		List<ChatMessage> recalledMessages = resolvePastMessages(notebookId, analysis, recentHistory);
		List<String> excludedFileNames = resolveExcludedFileNames(notebookId, pinnedDocIds);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks, recalledMessages, excludedFileNames, analysis);
		List<Citation> citations = buildCitations(chunks);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);

		StringBuilder fullResponse = new StringBuilder();
		Flux<String> tokenStream = spec.stream().content()
			.doOnNext(fullResponse::append)
			.doOnComplete(() -> saveMessage(notebookId, ChatMessage.Role.ASSISTANT, fullResponse.toString(), modelUsed));

		return new StreamContext(tokenStream, citations);
	}

	public StreamContext regenerate(String query, UUID notebookId, String modelOverride, List<UUID> pinnedDocIds) {
		List<ChatMessage> recentHistory = getRecentHistory(notebookId, CONDENSER_CONTEXT);
		QueryAnalysis analysis = analyzeIntentAndQuery(query, recentHistory);

		// DO NOT save the user query again, it already exists in the database.
		// saveMessage(notebookId, ChatMessage.Role.USER, query, null);

		List<DocumentChunk> chunks = resolveChunks(notebookId, analysis, pinnedDocIds);
		List<ChatMessage> recalledMessages = resolvePastMessages(notebookId, analysis, recentHistory);
		List<String> excludedFileNames = resolveExcludedFileNames(notebookId, pinnedDocIds);
		List<Message> springMessages = buildMessageHistory(notebookId, chunks, recalledMessages, excludedFileNames, analysis);
		List<Citation> citations = buildCitations(chunks);
		String modelUsed = resolveModel(modelOverride);

		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);

		StringBuilder fullResponse = new StringBuilder();
		Flux<String> tokenStream = spec.stream().content()
			.doOnNext(fullResponse::append)
			.doOnComplete(() -> saveMessage(notebookId, ChatMessage.Role.ASSISTANT, fullResponse.toString(), modelUsed));

		return new StreamContext(tokenStream, citations);
	}

	public StreamContext prepareSlideStream(UUID notebookId, String modelOverride, List<UUID> pinnedDocIds) {
		boolean hasPinFilter = pinnedDocIds != null && !pinnedDocIds.isEmpty();
		List<DocumentChunk> chunks = hasPinFilter 
				? chunkRepository.findByDocumentIdIn(pinnedDocIds)
				: chunkRepository.findByNotebookId(notebookId);

		// Limit to top 20 chunks to prevent rate limiting while retaining core context
		if (chunks.size() > 20) {
			chunks = chunks.subList(0, 20);
		}

		String context = chunks.stream()
			.map(c -> "[Source: " + c.getFileName() + " | Chunk " + c.getChunkIndex() + "]\n" + c.getContent())
			.collect(Collectors.joining("\n\n---\n\n"));

		String promptText = """
			You are an expert presentation content generator. Based on the uploaded documents, generate a structured presentation.
			You MUST respond ONLY with a valid JSON array of slide objects. No markdown, no code blocks, just raw JSON.

			The canvas is 960px wide and 540px tall. All coordinates are absolute pixel values in this space.
			Each slide has a "title" (string) and "elements" (array of text objects).

			JSON Schema per slide:
			{
			  "title": "Slide Title",
			  "elements": [
			    {
			      "type": "text",
			      "text": "Content text here. Use actual newline characters for bullet points.",
			      "x": 50,
			      "y": 100,
			      "width": 860,
			      "height": 80,
			      "fontSize": 18,
			      "fontStyle": "",
			      "fill": "c8cdc9",
			      "textAlign": "left"
			    }
			  ]
			}

			Rules:
			1. Generate 5-8 slides to cover the content thoroughly.
			2. Do NOT cram too much text into one slide. Split content across multiple slides.
			3. Each slide should have 2-4 text elements maximum.
			4. The title is rendered separately, so do NOT include it in elements.
			5. Use bullet points (• prefix) in text for lists.
			6. Keep fontSize between 14-24 for body text. Use 18 as default.
			7. Position elements so they don't overlap: start body text at y=100, space elements with ~10px gaps.
			8. For emphasis, set fontStyle to "bold".
			9. Keep each text block concise. Maximum 4-5 lines per text element.
			10. Use the full width (x=50, width=860) for most text.

			===== DOCUMENT CONTEXT =====
			%s
			===== END CONTEXT =====
			""".formatted(context);

		List<Message> springMessages = List.of(new UserMessage(promptText));
		ChatClient.ChatClientRequestSpec spec = buildSpec(springMessages, modelOverride);

		Flux<String> tokenStream = spec.stream().content();
		return new StreamContext(tokenStream, buildCitations(chunks));
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

	private List<Message> buildMessageHistory(UUID notebookId, List<DocumentChunk> currentChunks, List<ChatMessage> recalledMessages, List<String> excludedFileNames, QueryAnalysis analysis) {
		List<Message> messages = new ArrayList<>();
		messages.add(new SystemMessage(buildSystemPrompt(currentChunks, recalledMessages, excludedFileNames)));

		// Immediate conversational window is strictly locked to 4 messages (2 turns) 
		// to drastically save tokens. All long-term memory is handled semantically.
		List<ChatMessage> history = getRecentHistory(notebookId, 4);
		
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
	 * Analyzes the user's intent and rewrites the follow-up into a standalone search query.
	 * Returns a structured QueryAnalysis containing both the Intent and the optimized query.
	 */
	private QueryAnalysis analyzeIntentAndQuery(String rawQuery, List<ChatMessage> recentHistory) {
		try {
			String historyText = recentHistory.isEmpty() ? "No history yet." : recentHistory.stream()
					.map(m -> {
						String c = m.getContent();
						return m.getRole().name() + ": " + (c.length() > 200 ? c.substring(0, 200) : c);
					})
					.collect(Collectors.joining("\n"));

			String prompt = """
					You are an intelligent query routing agent for an advanced RAG system.
					Your task is to analyze the user's latest follow-up question and the recent conversation history to determine the optimal retrieval strategy.

					Categories of Intent:
					1. DOC_SEARCH: The user is asking a specific question that requires searching the uploaded knowledge base (documents/sources).
					2. CHAT_HISTORY: The user is referencing a previous message, asking you to repeat something, or discussing the ongoing conversation itself without needing new document retrieval.
					3. GENERAL: The user is engaging in casual chat (e.g., "hi", "thanks") or asking a general knowledge question (e.g., "write a python script") that does NOT require searching the uploaded documents.

					Instructions:
					1. Determine the intent.
					2. If the intent is DOC_SEARCH, rewrite the follow-up question into a highly optimized, standalone search query that captures all necessary context from the history.
					3. Output ONLY a valid JSON object with no markdown formatting.

					Format:
					{
					  "intent": "DOC_SEARCH" | "CHAT_HISTORY" | "GENERAL",
					  "standaloneQuery": "The optimized search query (or the original query if no rewrite needed)"
					}

					History:
					%s

					Follow-up: %s
					""".formatted(historyText, rawQuery);

			String json = CompletableFuture.supplyAsync(() ->
				chatClient.prompt()
						.messages(List.of(new UserMessage(prompt)))
						.call()
						.content()
			).get();

			if (json != null && json.trim().startsWith("```json")) {
				json = json.trim().substring(7);
				if (json.endsWith("```")) {
					json = json.substring(0, json.length() - 3);
				}
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode node = mapper.readTree(json != null ? json.trim() : "{}");
			
			String intentStr = node.has("intent") ? node.get("intent").asText() : "DOC_SEARCH";
			String standaloneQuery = node.has("standaloneQuery") ? node.get("standaloneQuery").asText() : rawQuery;
			
			Intent intent;
			try {
				intent = Intent.valueOf(intentStr);
			} catch (Exception e) {
				intent = Intent.DOC_SEARCH;
			}
			
			log.info("Query routed: Intent={}, StandaloneQuery={}", intent, standaloneQuery);
			return new QueryAnalysis(intent, standaloneQuery);
		} catch (Exception e) {
			log.warn("Query condensation failed, falling back to DOC_SEARCH: {}", e.getMessage());
			return new QueryAnalysis(Intent.DOC_SEARCH, rawQuery);
		}
	}

	private List<DocumentChunk> resolveChunks(UUID notebookId, QueryAnalysis analysis, List<UUID> pinnedDocIds) {
		// Dynamic Routing: If intent is not DOC_SEARCH, bypass the database entirely
		if (analysis.intent() == Intent.CHAT_HISTORY || analysis.intent() == Intent.GENERAL) {
			return List.of();
		}

		boolean hasPinFilter = pinnedDocIds != null && !pinnedDocIds.isEmpty();

		// Full-text search, then filter to pinned docs
		List<DocumentChunk> chunks = chunkRepository.searchByNotebookAndQuery(notebookId, analysis.standaloneQuery())
				.stream()
				.filter(c -> !hasPinFilter || pinnedDocIds.contains(c.getDocumentId()))
				.toList();

		// Fallback: If the user query was generic (e.g., "explain the documents") and matched no keywords,
		// but they explicitly pinned documents (or there are just documents in the notebook), supply them.
		if (chunks.isEmpty()) {
			List<DocumentChunk> fallbackChunks = hasPinFilter 
					? chunkRepository.findByDocumentIdIn(pinnedDocIds)
					: chunkRepository.findByNotebookId(notebookId);

			// Try to get the beginning of each document
			chunks = fallbackChunks.stream()
					.filter(c -> c.getChunkIndex() == 0 || c.getChunkIndex() == 1)
					.toList();
			
			if (chunks.isEmpty()) {
				chunks = new ArrayList<>(fallbackChunks);
			}
		}

		if (chunks.size() > 5) {
			chunks = chunks.subList(0, 5);
		}
		return chunks;
	}

	private List<ChatMessage> resolvePastMessages(UUID notebookId, QueryAnalysis analysis, List<ChatMessage> recentHistory) {
		if (analysis.intent() != Intent.CHAT_HISTORY) {
			return List.of();
		}

		// Fetch semantic past messages
		List<ChatMessage> semanticMessages = chatMessageRepository.searchByNotebookAndQuery(
				notebookId, analysis.standaloneQuery(), 5);

		// Extract IDs from recentHistory to avoid duplicate context
		List<UUID> recentIds = recentHistory.stream()
				.map(ChatMessage::getId)
				.toList();

		return semanticMessages.stream()
				.filter(m -> !recentIds.contains(m.getId()))
				.toList();
	}

	private String buildSystemPrompt(List<DocumentChunk> chunks, List<ChatMessage> recalledMessages, List<String> excludedFileNames) {
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

		String recalledBlock = "";
		if (!recalledMessages.isEmpty()) {
			String mems = recalledMessages.stream()
					.map(m -> m.getRole().name() + ": " + m.getContent())
					.collect(Collectors.joining("\n\n"));
			
			recalledBlock = """
				
				===== RECALLED PAST CONVERSATIONS =====
				The following are highly relevant snippets retrieved from past conversations with the user.
				Use them to seamlessly answer questions about past discussions or recall previously stated facts.
				
				%s
				===== END RECALLED CONVERSATIONS =====
				""".formatted(mems);
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
				""" + exclusionBlock + recalledBlock;
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
