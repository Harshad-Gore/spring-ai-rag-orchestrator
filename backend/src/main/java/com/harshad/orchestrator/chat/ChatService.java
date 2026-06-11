package com.harshad.orchestrator.chat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import com.harshad.orchestrator.document.DocumentChunk;
import com.harshad.orchestrator.document.DocumentChunkRepository;

import reactor.core.publisher.Flux;

@Service
public class ChatService {

	private final ChatClient chatClient;
	private final DocumentChunkRepository chunkRepository;

	public ChatService(ChatClient.Builder chatClientBuilder, DocumentChunkRepository chunkRepository) {
		this.chatClient = chatClientBuilder.build();
		this.chunkRepository = chunkRepository;
	}

	/** Non-streaming: used by the classic /ask endpoint */
	public ChatResponse ask(String query, UUID notebookId) {
		List<DocumentChunk> chunks = resolveChunks(notebookId, query);

		if (chunks.isEmpty()) {
			return new ChatResponse(
				"No documents have been uploaded to this notebook yet. Please upload some sources first, then ask me questions about them.",
				List.of()
			);
		}

		String systemPrompt = buildSystemPrompt(chunks);

		String response = chatClient.prompt()
			.system(systemPrompt)
			.user(query)
			.call()
			.content();

		return new ChatResponse(response, buildCitations(chunks));
	}

	/** Streaming: returns token-by-token Flux for the /stream endpoint */
	public StreamContext prepareStream(String query, UUID notebookId) {
		List<DocumentChunk> chunks = resolveChunks(notebookId, query);

		if (chunks.isEmpty()) {
			Flux<String> emptyFlux = Flux.just(
				"No documents have been uploaded to this notebook yet. Please upload some sources first, then ask me questions about them."
			);
			return new StreamContext(emptyFlux, List.of());
		}

		String systemPrompt = buildSystemPrompt(chunks);
		List<Citation> citations = buildCitations(chunks);

		Flux<String> tokenStream = chatClient.prompt()
			.system(systemPrompt)
			.user(query)
			.stream()
			.content();

		return new StreamContext(tokenStream, citations);
	}

	// ── helpers ──────────────────────────────────────────────────────────────

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
		String context = chunks.stream()
			.map(c -> "[Source: " + c.getFileName() + " | Chunk " + c.getChunkIndex() + "]\n" + c.getContent())
			.collect(Collectors.joining("\n\n---\n\n"));

		return """
			You are a knowledgeable research assistant. Answer questions based ONLY on the provided document context.

			Guidelines:
			- Answer using ONLY information found in the context below
			- If the context does not contain enough information, say so clearly
			- Be concise but thorough
			- Format your response using markdown where it improves readability (bold, lists, headers)
			- Do NOT repeat source file names in the body of your answer; citations are shown separately

			===== DOCUMENT CONTEXT =====

			""" + context + """

			===== END CONTEXT =====
			""";
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

	// ── records ───────────────────────────────────────────────────────────────

	public record ChatRequest(String query, String notebookId) {}
	public record ChatResponse(String response, List<Citation> citations) {}
	public record Citation(String source, String excerpt) {}
	public record StreamContext(Flux<String> tokenStream, List<Citation> citations) {}
}
