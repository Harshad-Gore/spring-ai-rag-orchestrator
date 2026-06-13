package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harshad.orchestrator.auth.AuthenticatedUser;
import com.harshad.orchestrator.auth.UserAccount;
import com.harshad.orchestrator.auth.UserAccountRepository;
import com.harshad.orchestrator.chat.ChatMessage;
import com.harshad.orchestrator.chat.ChatMessageRepository;
import com.harshad.orchestrator.document.Document;
import com.harshad.orchestrator.document.DocumentRepository;

@RestController
@RequestMapping("/api/shared/notebooks")
public class SharedNotebookController {

	private final SharedNotebookService sharedNotebookService;
	private final DocumentRepository documentRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final UserAccountRepository userAccountRepository;

	public SharedNotebookController(
			SharedNotebookService sharedNotebookService,
			DocumentRepository documentRepository,
			ChatMessageRepository chatMessageRepository,
			UserAccountRepository userAccountRepository) {
		this.sharedNotebookService = sharedNotebookService;
		this.documentRepository = documentRepository;
		this.chatMessageRepository = chatMessageRepository;
		this.userAccountRepository = userAccountRepository;
	}

	@GetMapping("/{shareToken}")
	public ResponseEntity<SharedNotebookResponse> getShared(@PathVariable UUID shareToken) {
		Notebook notebook = sharedNotebookService.getByShareToken(shareToken);
		String ownerEmail = userAccountRepository.findById(notebook.getUserId())
			.map(UserAccount::getEmail)
			.orElse("Unknown User");
		return ResponseEntity.ok(SharedNotebookResponse.from(notebook, ownerEmail));
	}

	@GetMapping("/{shareToken}/documents")
	public ResponseEntity<List<DocumentResponse>> getSharedDocuments(@PathVariable UUID shareToken) {
		Notebook notebook = sharedNotebookService.getByShareToken(shareToken);
		String resources = notebook.getSharedResources();
		if (resources == null || !resources.contains("DOCS")) {
			return ResponseEntity.ok(List.of());
		}

		List<Document> docs = documentRepository.findByNotebookIdOrderByCreatedAtDesc(notebook.getId());
		return ResponseEntity.ok(docs.stream().map(DocumentResponse::from).toList());
	}

	@GetMapping("/{shareToken}/history")
	public ResponseEntity<List<ChatMessageDto>> getSharedHistory(@PathVariable UUID shareToken) {
		Notebook notebook = sharedNotebookService.getByShareToken(shareToken);
		String resources = notebook.getSharedResources();
		if (resources == null || !resources.contains("CHAT")) {
			return ResponseEntity.ok(List.of());
		}

		List<ChatMessage> messages = chatMessageRepository.findByNotebookIdOrderByCreatedAtAsc(notebook.getId());
		return ResponseEntity.ok(messages.stream()
			.map(m -> new ChatMessageDto(
				m.getId().toString(),
				m.getRole().name().toLowerCase(),
				m.getContent(),
				m.getModelUsed(),
				m.getCreatedAt().toString()))
			.toList());
	}

	@PostMapping("/{shareToken}/clone")
	public ResponseEntity<CloneResponse> cloneShared(Authentication auth, @PathVariable UUID shareToken) {
		UUID userId = ((AuthenticatedUser) auth.getPrincipal()).id();
		Notebook cloned = sharedNotebookService.cloneNotebook(shareToken, userId);
		return ResponseEntity.status(HttpStatus.CREATED).body(new CloneResponse(cloned.getId().toString()));
	}

	public record SharedNotebookResponse(String id, String title, String shareType, String sharedResources, String createdAt, String ownerEmail) {
		static SharedNotebookResponse from(Notebook nb, String ownerEmail) {
			return new SharedNotebookResponse(
				nb.getId().toString(),
				nb.getTitle(),
				nb.getShareType(),
				nb.getSharedResources(),
				nb.getCreatedAt().toString(),
				ownerEmail
			);
		}
	}

	public record DocumentResponse(String id, String fileName, String contentType, long sizeBytes, String status) {
		static DocumentResponse from(Document doc) {
			return new DocumentResponse(
				doc.getId().toString(),
				doc.getFileName(),
				doc.getContentType(),
				doc.getSizeBytes(),
				doc.getStatus().name()
			);
		}
	}

	public record ChatMessageDto(String id, String role, String content, String modelUsed, String createdAt) {}
	public record CloneResponse(String newNotebookId) {}
}
