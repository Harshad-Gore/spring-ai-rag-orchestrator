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
@Table(name = "notebooks")
public class Notebook {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "title", nullable = false, length = 255)
	private String title;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "share_token", unique = true)
	private UUID shareToken;

	@Column(name = "share_type", length = 32)
	private String shareType;

	@Column(name = "shared_resources", length = 128)
	private String sharedResources;

	@Column(name = "cloned_from_email", length = 255)
	private String clonedFromEmail;

	protected Notebook() {}

	public Notebook(UUID userId, String title) {
		this.userId = userId;
		this.title = title;
	}

	public UUID getId() { return id; }
	public UUID getUserId() { return userId; }
	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }

	public UUID getShareToken() { return shareToken; }
	public void setShareToken(UUID shareToken) { this.shareToken = shareToken; }

	public String getShareType() { return shareType; }
	public void setShareType(String shareType) { this.shareType = shareType; }

	public String getSharedResources() { return sharedResources; }
	public void setSharedResources(String sharedResources) { this.sharedResources = sharedResources; }

	public String getClonedFromEmail() { return clonedFromEmail; }
	public void setClonedFromEmail(String clonedFromEmail) { this.clonedFromEmail = clonedFromEmail; }
}
