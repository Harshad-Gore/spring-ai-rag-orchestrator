package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;

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
	public NotebookFolder move(UUID id, UUID userId, UUID parentId) {
		Map<UUID, NotebookFolder> foldersById = folderRepository.findByUserId(userId).stream()
				.collect(java.util.stream.Collectors.toMap(NotebookFolder::getId, Function.identity()));

		NotebookFolder folder = foldersById.get(id);
		if (folder == null) {
			throw new IllegalArgumentException("Folder not found");
		}

		if (parentId != null) {
			if (id.equals(parentId)) {
				throw new IllegalArgumentException("Folder cannot be moved into itself");
			}

			NotebookFolder parent = foldersById.get(parentId);
			if (parent == null) {
				throw new IllegalArgumentException("Target folder not found");
			}

			UUID cursor = parent.getId();
			while (cursor != null) {
				if (id.equals(cursor)) {
					throw new IllegalArgumentException("Folder cannot be moved into its descendant");
				}
				NotebookFolder cursorFolder = foldersById.get(cursor);
				cursor = cursorFolder != null ? cursorFolder.getParentId() : null;
			}
		}

		if (Objects.equals(folder.getParentId(), parentId)) {
			return folder;
		}

		folder.setParentId(parentId);
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
