package com.harshad.orchestrator.chat;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.harshad.orchestrator.chat.ChatService.ChatRequest;
import com.harshad.orchestrator.chat.ChatService.ChatResponse;
import com.harshad.orchestrator.chat.ChatService.Citation;
import com.harshad.orchestrator.chat.ChatService.StreamContext;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

	private static final Logger log = LoggerFactory.getLogger(ChatController.class);

	private final ChatService chatService;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public ChatController(ChatService chatService) {
		this.chatService = chatService;
	}

	/** Classic blocking endpoint — kept as fallback */
	@PostMapping("/ask")
	public ResponseEntity<ChatResponse> ask(@RequestBody ChatRequest request) {
		try {
			ChatResponse response = chatService.ask(
				request.query(), UUID.fromString(request.notebookId()), request.model());
			return ResponseEntity.ok(response);
		} catch (Exception ex) {
			log.error("Chat error for notebook {}: {}", request.notebookId(), ex.getMessage(), ex);
			return ResponseEntity.ok(new ChatResponse(
				"I encountered an error processing your request. Please try again.",
				List.of()
			));
		}
	}

	/**
	 * Streaming SSE endpoint.
	 * Each SSE event carries one token. When the stream is complete, a final
	 * event with type "citations" is emitted carrying a JSON array of sources.
	 */
	@PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public Flux<ServerSentEvent<String>> stream(@RequestBody ChatRequest request) {
		try {
			StreamContext ctx = chatService.prepareStream(
				request.query(), UUID.fromString(request.notebookId()), request.model());

			Flux<ServerSentEvent<String>> tokenEvents = ctx.tokenStream()
				.map(token -> {
					try {
						return ServerSentEvent.<String>builder()
							.event("token")
							.data(objectMapper.writeValueAsString(token))
							.build();
					} catch (Exception e) {
						return ServerSentEvent.<String>builder().event("token").data("\"\"").build();
					}
				});

			// After all tokens, emit a citations event then a done sentinel
			String citationsJson = serializeCitations(ctx.citations());

			Flux<ServerSentEvent<String>> tail = Flux.just(
				ServerSentEvent.<String>builder()
					.event("citations")
					.data(citationsJson)
					.build(),
				ServerSentEvent.<String>builder()
					.event("done")
					.data("")
					.build()
			);

			return Flux.concat(tokenEvents, tail)
				.onErrorResume(ex -> {
					log.error("Stream error: {}", ex.getMessage(), ex);
					return Flux.just(ServerSentEvent.<String>builder()
						.event("error")
						.data("Stream interrupted. Please try again.")
						.build());
				});

		} catch (Exception ex) {
			log.error("Failed to start stream: {}", ex.getMessage(), ex);
			return Flux.just(ServerSentEvent.<String>builder()
				.event("error")
				.data("Failed to start stream: " + ex.getMessage())
				.build());
		}
	}

	/** Fetch chat history for a notebook */
	@GetMapping("/notebook/{notebookId}/history")
	public ResponseEntity<List<ChatMessageDto>> getHistory(@PathVariable UUID notebookId) {
		List<ChatMessage> messages = chatService.getHistory(notebookId);
		List<ChatMessageDto> dtos = messages.stream()
			.map(m -> new ChatMessageDto(
				m.getId().toString(),
				m.getRole().name().toLowerCase(),
				m.getContent(),
				m.getModelUsed(),
				m.getCreatedAt().toString()))
			.toList();
		return ResponseEntity.ok(dtos);
	}

	private String serializeCitations(List<Citation> citations) {
		try {
			return objectMapper.writeValueAsString(citations);
		} catch (Exception e) {
			return "[]";
		}
	}

	public record ChatMessageDto(String id, String role, String content, String modelUsed, String createdAt) {}
}
