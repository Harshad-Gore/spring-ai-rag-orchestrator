package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotebookFolderRepository extends JpaRepository<NotebookFolder, UUID> {
	List<NotebookFolder> findByUserId(UUID userId);
}
