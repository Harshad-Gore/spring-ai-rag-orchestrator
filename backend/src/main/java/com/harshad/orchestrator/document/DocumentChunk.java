package com.harshad.orchestrator.document;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "document_chunks")
public class DocumentChunk {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "document_id", nullable = false)
	private UUID documentId;

	@Column(name = "notebook_id", nullable = false)
	private UUID notebookId;

	@Column(name = "file_name", nullable = false, length = 500)
	private String fileName;

	@Column(name = "chunk_index", nullable = false)
	private int chunkIndex;

	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected DocumentChunk() {}

	public DocumentChunk(UUID documentId, UUID notebookId, String fileName, int chunkIndex, String content) {
		this.documentId = documentId;
		this.notebookId = notebookId;
		this.fileName = fileName;
		this.chunkIndex = chunkIndex;
		this.content = content;
	}

	public UUID getId() { return id; }
	public UUID getDocumentId() { return documentId; }
	public UUID getNotebookId() { return notebookId; }
	public String getFileName() { return fileName; }
	public int getChunkIndex() { return chunkIndex; }
	public String getContent() { return content; }
	public Instant getCreatedAt() { return createdAt; }
}
