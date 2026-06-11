package com.harshad.orchestrator.chat;

import java.util.UUID;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harshad.orchestrator.chat.ChatService.ChatRequest;
import com.harshad.orchestrator.chat.ChatService.ChatResponse;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

	private final ChatService chatService;

	public ChatController(ChatService chatService) {
		this.chatService = chatService;
	}

	@PostMapping("/ask")
	public ChatResponse ask(@RequestBody ChatRequest request) {
		return chatService.ask(request.query(), UUID.fromString(request.notebookId()));
	}
}
