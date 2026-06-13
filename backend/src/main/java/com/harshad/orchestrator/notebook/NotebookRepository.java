package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotebookRepository extends JpaRepository<Notebook, UUID> {
	List<Notebook> findByUserIdOrderByCreatedAtDesc(UUID userId);
	java.util.Optional<Notebook> findByShareToken(UUID shareToken);
}
