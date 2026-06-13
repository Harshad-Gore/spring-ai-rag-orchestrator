package com.harshad.orchestrator.notebook;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notebook_folders")
public class NotebookFolder {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "parent_id")
	private UUID parentId;

	@Column(name = "name", nullable = false, length = 255)
	private String name;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected NotebookFolder() {}

	public NotebookFolder(UUID userId, UUID parentId, String name) {
		this.userId = userId;
		this.parentId = parentId;
		this.name = name;
	}

	public UUID getId() { return id; }
	public UUID getUserId() { return userId; }
	public UUID getParentId() { return parentId; }
	public void setParentId(UUID parentId) { this.parentId = parentId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
