package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TagService {

	private final TagRepository tagRepository;
	private final NotebookRepository notebookRepository;

	public TagService(TagRepository tagRepository, NotebookRepository notebookRepository) {
		this.tagRepository = tagRepository;
		this.notebookRepository = notebookRepository;
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

		List<Notebook> notebooks = notebookRepository.findByUserIdOrderByCreatedAtDesc(userId);
		for (Notebook nb : notebooks) {
			if (nb.getTagIds().contains(id)) {
				nb.getTagIds().remove(id);
				notebookRepository.save(nb);
			}
		}

		tagRepository.delete(tag);
	}
}
