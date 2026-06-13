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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.harshad.orchestrator.auth.AuthenticatedUser;

@RestController
@RequestMapping("/api/tags")
public class TagController {

	private final TagService tagService;

	public TagController(TagService tagService) {
		this.tagService = tagService;
	}

	@GetMapping
	public List<TagResponse> list(Authentication auth) {
		UUID userId = extractUserId(auth);
		return tagService.listByUser(userId).stream()
			.map(TagResponse::from)
			.toList();
	}

	@PostMapping
	public ResponseEntity<TagResponse> create(
			Authentication auth,
			@RequestBody CreateTagRequest request) {
		UUID userId = extractUserId(auth);
		Tag tag = tagService.create(userId, request.name(), request.colorHex());
		return ResponseEntity.status(HttpStatus.CREATED).body(TagResponse.from(tag));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
		UUID userId = extractUserId(auth);
		tagService.delete(id, userId);
		return ResponseEntity.noContent().build();
	}

	private UUID extractUserId(Authentication auth) {
		return ((AuthenticatedUser) auth.getPrincipal()).id();
	}

	public record CreateTagRequest(String name, String colorHex) {}
	public record TagResponse(String id, String name, String colorHex) {
		static TagResponse from(Tag tag) {
			return new TagResponse(
				tag.getId().toString(),
				tag.getName(),
				tag.getColorHex()
			);
		}
	}
}
