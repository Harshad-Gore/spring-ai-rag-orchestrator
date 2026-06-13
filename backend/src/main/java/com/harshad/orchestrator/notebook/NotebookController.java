package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harshad.orchestrator.auth.AuthenticatedUser;
import com.harshad.orchestrator.document.DocumentRepository;

@RestController
@RequestMapping("/api/notebooks")
public class NotebookController {

	private final NotebookService notebookService;
	private final DocumentRepository documentRepository;

	public NotebookController(NotebookService notebookService, DocumentRepository documentRepository) {
		this.notebookService = notebookService;
		this.documentRepository = documentRepository;
	}

	@GetMapping
	public List<NotebookResponse> list(Authentication auth) {
		UUID userId = extractUserId(auth);
		return notebookService.listByUser(userId).stream()
			.map(nb -> NotebookResponse.from(nb, documentRepository.countByNotebookId(nb.getId())))
			.toList();
	}

	@PostMapping
	public ResponseEntity<NotebookResponse> create(
			Authentication auth,
			@RequestBody CreateRequest request) {
		UUID userId = extractUserId(auth);
		Notebook notebook = notebookService.create(userId, request.title());
		return ResponseEntity.status(HttpStatus.CREATED).body(NotebookResponse.from(notebook, 0));
	}

	@PutMapping("/{id}")
	public NotebookResponse rename(
			Authentication auth,
			@PathVariable UUID id,
			@RequestBody RenameRequest request) {
		UUID userId = extractUserId(auth);
		Notebook nb = notebookService.rename(id, userId, request.title());
		return NotebookResponse.from(nb, documentRepository.countByNotebookId(nb.getId()));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
		UUID userId = extractUserId(auth);
		notebookService.delete(id, userId);
		return ResponseEntity.noContent().build();
	}

	@PutMapping("/{id}/folder")
	public NotebookResponse moveToFolder(
			Authentication auth,
			@PathVariable UUID id,
			@RequestBody MoveToFolderRequest request) {
		UUID userId = extractUserId(auth);
		Notebook nb = notebookService.moveNotebookToFolder(id, userId, request.folderId());
		return NotebookResponse.from(nb, documentRepository.countByNotebookId(nb.getId()));
	}

	@PutMapping("/{id}/tags")
	public NotebookResponse updateTags(
			Authentication auth,
			@PathVariable UUID id,
			@RequestBody UpdateTagsRequest request) {
		UUID userId = extractUserId(auth);
		Notebook nb = notebookService.updateTags(id, userId, request.tagIds());
		return NotebookResponse.from(nb, documentRepository.countByNotebookId(nb.getId()));
	}

	@PostMapping("/{id}/share")
	public ResponseEntity<ShareResponse> share(
			Authentication auth,
			@PathVariable UUID id,
			@RequestBody ShareRequest request) {
		UUID userId = extractUserId(auth);
		String token = notebookService.share(id, userId, request.shareType(), request.sharedResources());
		return ResponseEntity.ok(new ShareResponse(token));
	}

	@PostMapping("/{id}/revoke")
	public ResponseEntity<Void> revoke(Authentication auth, @PathVariable UUID id) {
		UUID userId = extractUserId(auth);
		notebookService.revoke(id, userId);
		return ResponseEntity.noContent().build();
	}

	private UUID extractUserId(Authentication auth) {
		return ((AuthenticatedUser) auth.getPrincipal()).id();
	}

	public record CreateRequest(String title) {}
	public record RenameRequest(String title) {}
	public record MoveToFolderRequest(UUID folderId) {}
	public record UpdateTagsRequest(List<UUID> tagIds) {}
	public record ShareRequest(String shareType, String sharedResources) {}
	public record ShareResponse(String shareToken) {}
	public record NotebookResponse(String id, String title, String createdAt, String shareToken, String shareType, String sharedResources, String clonedFromEmail, String folderId, List<String> tagIds, int documentCount) {
		static NotebookResponse from(Notebook nb, int documentCount) {
			return new NotebookResponse(
				nb.getId().toString(),
				nb.getTitle(),
				nb.getCreatedAt().toString(),
				nb.getShareToken() != null ? nb.getShareToken().toString() : null,
				nb.getShareType(),
				nb.getSharedResources(),
				nb.getClonedFromEmail(),
				nb.getFolderId() != null ? nb.getFolderId().toString() : null,
				nb.getTagIds().stream().map(UUID::toString).toList(),
				documentCount
			);
		}
	}
}
