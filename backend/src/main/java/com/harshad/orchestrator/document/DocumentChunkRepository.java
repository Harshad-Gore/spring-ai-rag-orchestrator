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
			ORDER BY embedding <-> cast(:queryEmbedding as vector)
			LIMIT 10
			""", nativeQuery = true)
	List<DocumentChunk> searchByNotebookAndVector(
			@Param("notebookId") UUID notebookId,
			@Param("queryEmbedding") String queryEmbedding);
}
