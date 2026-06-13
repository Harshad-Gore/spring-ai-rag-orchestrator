package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotebookFolderService {

	private final NotebookFolderRepository folderRepository;

	public NotebookFolderService(NotebookFolderRepository folderRepository) {
		this.folderRepository = folderRepository;
	}

	public List<NotebookFolder> listByUser(UUID userId) {
		return folderRepository.findByUserId(userId);
	}

	@Transactional
	public NotebookFolder create(UUID userId, UUID parentId, String name) {
		return folderRepository.save(new NotebookFolder(userId, parentId, name));
	}

	@Transactional
	public NotebookFolder rename(UUID id, UUID userId, String newName) {
		NotebookFolder folder = folderRepository.findById(id)
				.filter(f -> f.getUserId().equals(userId))
				.orElseThrow(() -> new IllegalArgumentException("Folder not found"));
		folder.setName(newName);
		return folderRepository.save(folder);
	}

	@Transactional
	public void delete(UUID id, UUID userId) {
		NotebookFolder folder = folderRepository.findById(id)
				.filter(f -> f.getUserId().equals(userId))
				.orElseThrow(() -> new IllegalArgumentException("Folder not found"));
		folderRepository.delete(folder);
	}
}
