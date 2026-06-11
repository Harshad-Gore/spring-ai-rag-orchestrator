package com.harshad.orchestrator.document;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
public class Document {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "notebook_id", nullable = false)
	private UUID notebookId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "file_name", nullable = false, length = 500)
	private String fileName;

	@Column(name = "content_type")
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(name = "s3_key", nullable = false, length = 1024)
	private String s3Key;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private DocumentStatus status = DocumentStatus.PENDING;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected Document() {}

	public Document(UUID notebookId, UUID userId, String fileName, String contentType, long sizeBytes, String s3Key) {
		this.notebookId = notebookId;
		this.userId = userId;
		this.fileName = fileName;
		this.contentType = contentType;
		this.sizeBytes = sizeBytes;
		this.s3Key = s3Key;
	}

	public UUID getId() { return id; }
	public UUID getNotebookId() { return notebookId; }
	public UUID getUserId() { return userId; }
	public String getFileName() { return fileName; }
	public String getContentType() { return contentType; }
	public long getSizeBytes() { return sizeBytes; }
	public String getS3Key() { return s3Key; }
	public void setS3Key(String s3Key) { this.s3Key = s3Key; }
	public DocumentStatus getStatus() { return status; }
	public void setStatus(DocumentStatus status) { this.status = status; }
	public Instant getCreatedAt() { return createdAt; }
}
