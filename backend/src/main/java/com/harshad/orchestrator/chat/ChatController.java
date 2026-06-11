package com.harshad.orchestrator.chat;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harshad.orchestrator.chat.ChatService.ChatRequest;
import com.harshad.orchestrator.chat.ChatService.ChatResponse;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

	private static final Logger log = LoggerFactory.getLogger(ChatController.class);

	private final ChatService chatService;

	public ChatController(ChatService chatService) {
		this.chatService = chatService;
	}

	@PostMapping("/ask")
	public ResponseEntity<ChatResponse> ask(@RequestBody ChatRequest request) {
		try {
			ChatResponse response = chatService.ask(request.query(), UUID.fromString(request.notebookId()));
			return ResponseEntity.ok(response);
		} catch (Exception ex) {
			log.error("Chat error for notebook {}: {}", request.notebookId(), ex.getMessage(), ex);
			return ResponseEntity.ok(new ChatResponse(
				"I encountered an error processing your request. Please try again. Error: " + ex.getMessage(),
				List.of()
			));
		}
	}
}
