package com.harshad.orchestrator.document;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.harshad.orchestrator.auth.AuthenticatedUser;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

	private final DocumentService documentService;

	public DocumentController(DocumentService documentService) {
		this.documentService = documentService;
	}

	@PostMapping("/ingest")
	public ResponseEntity<List<DocumentResponse>> ingest(
			Authentication auth,
			@RequestParam("files") List<MultipartFile> files,
			@RequestParam("notebookId") UUID notebookId) {
		UUID userId = ((AuthenticatedUser) auth.getPrincipal()).id();
		List<Document> docs = documentService.ingest(files, notebookId, userId);
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(docs.stream().map(DocumentResponse::from).toList());
	}

	@GetMapping
	public List<DocumentResponse> list(
			Authentication auth,
			@RequestParam("notebookId") UUID notebookId) {
		return documentService.listByNotebook(notebookId).stream()
			.map(DocumentResponse::from)
			.toList();
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
		UUID userId = ((AuthenticatedUser) auth.getPrincipal()).id();
		documentService.delete(id, userId);
		return ResponseEntity.noContent().build();
	}

	public record DocumentResponse(
			String id,
			String notebookId,
			String fileName,
			String contentType,
			long sizeBytes,
			String status,
			String createdAt) {
		static DocumentResponse from(Document doc) {
			return new DocumentResponse(
				doc.getId().toString(),
				doc.getNotebookId().toString(),
				doc.getFileName(),
				doc.getContentType(),
				doc.getSizeBytes(),
				doc.getStatus().name(),
				doc.getCreatedAt().toString()
			);
		}
	}
}
