package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TagService {

	private final TagRepository tagRepository;

	public TagService(TagRepository tagRepository) {
		this.tagRepository = tagRepository;
	}

	public List<Tag> listByUser(UUID userId) {
		return tagRepository.findByUserId(userId);
	}

	@Transactional
	public Tag create(UUID userId, String name, String colorHex) {
		return tagRepository.save(new Tag(userId, name, colorHex));
	}

	@Transactional
	public void delete(UUID id, UUID userId) {
		Tag tag = tagRepository.findById(id)
				.filter(t -> t.getUserId().equals(userId))
				.orElseThrow(() -> new IllegalArgumentException("Tag not found"));
		tagRepository.delete(tag);
	}
}
