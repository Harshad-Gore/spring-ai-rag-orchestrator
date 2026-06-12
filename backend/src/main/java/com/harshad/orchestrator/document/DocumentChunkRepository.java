package com.harshad.orchestrator.document;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

	List<DocumentChunk> findByDocumentId(UUID documentId);

	List<DocumentChunk> findByNotebookId(UUID notebookId);

	List<DocumentChunk> findByDocumentIdIn(List<UUID> documentIds);

	void deleteByDocumentId(UUID documentId);

	@Query(value = """
			SELECT * FROM document_chunks
			WHERE notebook_id = :notebookId
			AND to_tsvector('english', content) @@ plainto_tsquery('english', :query)
			ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', :query)) DESC
			LIMIT 10
			""", nativeQuery = true)
	List<DocumentChunk> searchByNotebookAndQuery(
			@Param("notebookId") UUID notebookId,
			@Param("query") String query);
}
