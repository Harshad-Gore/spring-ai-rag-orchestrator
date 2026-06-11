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

@Service
public class ChatService {

	private final ChatClient chatClient;
	private final DocumentChunkRepository chunkRepository;

	public ChatService(ChatClient.Builder chatClientBuilder, DocumentChunkRepository chunkRepository) {
		this.chatClient = chatClientBuilder.build();
		this.chunkRepository = chunkRepository;
	}

	public ChatResponse ask(String query, UUID notebookId) {
		List<DocumentChunk> chunks = chunkRepository.searchByNotebookAndQuery(notebookId, query);

		if (chunks.isEmpty()) {
			chunks = chunkRepository.findByNotebookId(notebookId);
			if (chunks.size() > 15) {
				chunks = chunks.subList(0, 15);
			}
		}

		if (chunks.isEmpty()) {
			return new ChatResponse(
				"No documents have been uploaded to this notebook yet. Please upload some sources first, then ask me questions about them.",
				List.of()
			);
		}

		String context = chunks.stream()
			.map(c -> "[Source: " + c.getFileName() + " | Chunk " + c.getChunkIndex() + "]\n" + c.getContent())
			.collect(Collectors.joining("\n\n---\n\n"));

		String systemPrompt = """
			You are a knowledgeable research assistant. Answer questions based ONLY on the provided document context.

			Guidelines:
			- Answer using ONLY information found in the context below
			- If the context does not contain enough information, say so clearly
			- Cite which source document contains the relevant information
			- Be concise but thorough
			- Use direct quotes when appropriate

			===== DOCUMENT CONTEXT =====

			""" + context + """

			===== END CONTEXT =====
			""";

		String response = chatClient.prompt()
			.system(systemPrompt)
			.user(query)
			.call()
			.content();

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

		List<ChatResponse.Citation> citations = uniqueCitations.entrySet().stream()
			.map(e -> new ChatResponse.Citation(e.getKey(), e.getValue()))
			.limit(5)
			.toList();

		return new ChatResponse(response, citations);
	}

	public record ChatRequest(String query, String notebookId) {}

	public record ChatResponse(String response, List<Citation> citations) {
		public record Citation(String source, String excerpt) {}
	}
}
