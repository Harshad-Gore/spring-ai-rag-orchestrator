package com.harshad.orchestrator.notebook;

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
@Table(name = "tags")
public class Tag {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "name", nullable = false, length = 50)
	private String name;

	@Column(name = "color_hex", nullable = false, length = 7)
	private String colorHex;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected Tag() {}

	public Tag(UUID userId, String name, String colorHex) {
		this.userId = userId;
		this.name = name;
		this.colorHex = colorHex != null ? colorHex : "#657069";
	}

	public UUID getId() { return id; }
	public UUID getUserId() { return userId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getColorHex() { return colorHex; }
	public void setColorHex(String colorHex) { this.colorHex = colorHex; }
	public Instant getCreatedAt() { return createdAt; }
}
