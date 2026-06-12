package com.harshad.orchestrator.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

	List<ChatMessage> findByNotebookIdOrderByCreatedAtAsc(UUID notebookId);

	/** Returns the most recent {@code pageable.getPageSize()} messages, oldest-first. */
	@Query("""
			SELECT m FROM ChatMessage m
			WHERE m.notebookId = :notebookId
			ORDER BY m.createdAt DESC
			""")
	List<ChatMessage> findRecentByNotebookId(@Param("notebookId") UUID notebookId, Pageable pageable);
}
