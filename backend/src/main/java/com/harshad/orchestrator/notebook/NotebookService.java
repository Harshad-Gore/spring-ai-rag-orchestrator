package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotebookService {

	private final NotebookRepository notebookRepository;

	public NotebookService(NotebookRepository notebookRepository) {
		this.notebookRepository = notebookRepository;
	}

	@Transactional(readOnly = true)
	public List<Notebook> listByUser(UUID userId) {
		return notebookRepository.findByUserIdOrderByCreatedAtDesc(userId);
	}

	@Transactional
	public Notebook create(UUID userId, String title) {
		return notebookRepository.save(new Notebook(userId, title != null ? title : "Untitled Notebook"));
	}

	@Transactional
	public Notebook rename(UUID notebookId, UUID userId, String newTitle) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to modify this notebook");
		}
		notebook.setTitle(newTitle);
		return notebookRepository.save(notebook);
	}

	@Transactional
	public void delete(UUID notebookId, UUID userId) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to delete this notebook");
		}
		notebookRepository.delete(notebook);
	}
}
