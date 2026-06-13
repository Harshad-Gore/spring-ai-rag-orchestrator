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

@RestController
@RequestMapping("/api/folders")
public class NotebookFolderController {

	private final NotebookFolderService folderService;

	public NotebookFolderController(NotebookFolderService folderService) {
		this.folderService = folderService;
	}

	@GetMapping
	public List<FolderResponse> list(Authentication auth) {
		UUID userId = extractUserId(auth);
		return folderService.listByUser(userId).stream()
			.map(FolderResponse::from)
			.toList();
	}

	@PostMapping
	public ResponseEntity<FolderResponse> create(
			Authentication auth,
			@RequestBody CreateFolderRequest request) {
		UUID userId = extractUserId(auth);
		NotebookFolder folder = folderService.create(userId, request.parentId(), request.name());
		return ResponseEntity.status(HttpStatus.CREATED).body(FolderResponse.from(folder));
	}

	@PutMapping("/{id}")
	public FolderResponse rename(
			Authentication auth,
			@PathVariable UUID id,
			@RequestBody RenameFolderRequest request) {
		UUID userId = extractUserId(auth);
		return FolderResponse.from(folderService.rename(id, userId, request.name()));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
		UUID userId = extractUserId(auth);
		folderService.delete(id, userId);
		return ResponseEntity.noContent().build();
	}

	private UUID extractUserId(Authentication auth) {
		return ((AuthenticatedUser) auth.getPrincipal()).id();
	}

	public record CreateFolderRequest(String name, UUID parentId) {}
	public record RenameFolderRequest(String name) {}
	public record FolderResponse(String id, String parentId, String name, String createdAt) {
		static FolderResponse from(NotebookFolder folder) {
			return new FolderResponse(
				folder.getId().toString(),
				folder.getParentId() != null ? folder.getParentId().toString() : null,
				folder.getName(),
				folder.getCreatedAt().toString()
			);
		}
	}
}
