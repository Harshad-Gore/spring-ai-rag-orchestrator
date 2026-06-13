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

	@Transactional
	public Notebook moveNotebookToFolder(UUID notebookId, UUID userId, UUID folderId) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to modify this notebook");
		}
		notebook.setFolderId(folderId);
		return notebookRepository.save(notebook);
	}

	@Transactional
	public Notebook updateTags(UUID notebookId, UUID userId, List<UUID> tagIds) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to modify this notebook");
		}
		notebook.setTagIds(tagIds);
		return notebookRepository.save(notebook);
	}

	@Transactional
	public String share(UUID notebookId, UUID userId, String shareType, String sharedResources) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to share this notebook");
		}
		if (notebook.getShareToken() == null) {
			notebook.setShareToken(UUID.randomUUID());
		}
		notebook.setShareType(shareType);
		notebook.setSharedResources(sharedResources);
		notebookRepository.save(notebook);
		return notebook.getShareToken().toString();
	}

	@Transactional
	public void revoke(UUID notebookId, UUID userId) {
		Notebook notebook = notebookRepository.findById(notebookId)
			.orElseThrow(() -> new IllegalArgumentException("Notebook not found"));
		if (!notebook.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to modify this notebook");
		}
		notebook.setShareToken(null);
		notebook.setShareType(null);
		notebook.setSharedResources(null);
		notebookRepository.save(notebook);
	}
}
