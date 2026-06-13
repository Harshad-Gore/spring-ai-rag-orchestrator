package com.harshad.orchestrator.document;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
	List<Document> findByNotebookIdOrderByCreatedAtDesc(UUID notebookId);

	@Query("""
		select
			d.notebookId as notebookId,
			count(d) as documentCount,
			coalesce(sum(d.sizeBytes), 0) as totalSizeBytes,
			min(d.contentType) as primaryContentType
		from Document d
		where d.notebookId in :notebookIds
		group by d.notebookId
		""")
	List<NotebookDocumentSummary> summarizeByNotebookIds(@Param("notebookIds") List<UUID> notebookIds);

	interface NotebookDocumentSummary {
		UUID getNotebookId();
		long getDocumentCount();
		long getTotalSizeBytes();
		String getPrimaryContentType();
	}
}
