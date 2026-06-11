package com.harshad.orchestrator.chat;

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
@Table(name = "chat_messages")
public class ChatMessage {

	public enum Role { USER, ASSISTANT }

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "notebook_id", nullable = false)
	private UUID notebookId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private Role role;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(name = "model_used", length = 128)
	private String modelUsed;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected ChatMessage() {}

	public ChatMessage(UUID notebookId, Role role, String content, String modelUsed) {
		this.notebookId = notebookId;
		this.role = role;
		this.content = content;
		this.modelUsed = modelUsed;
	}

	public UUID getId() { return id; }
	public UUID getNotebookId() { return notebookId; }
	public Role getRole() { return role; }
	public String getContent() { return content; }
	public String getModelUsed() { return modelUsed; }
	public Instant getCreatedAt() { return createdAt; }
}
