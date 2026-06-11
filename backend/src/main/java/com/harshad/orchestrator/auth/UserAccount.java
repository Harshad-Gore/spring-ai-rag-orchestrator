package com.harshad.orchestrator.auth;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
	name = "app_users",
	uniqueConstraints = @UniqueConstraint(name = "uk_app_users_email", columnNames = "email"),
	indexes = @Index(name = "idx_app_users_email", columnList = "email")
)
public class UserAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "email", nullable = false, length = 320)
	private String email;

	@Column(name = "full_name", nullable = false, length = 120)
	private String fullName;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "avatar_url", length = 1024)
	private String avatarUrl;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 32)
	private UserRole role = UserRole.USER;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private UserStatus status = UserStatus.ACTIVE;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected UserAccount() {
	}

	public UserAccount(String email, String fullName, String passwordHash) {
		this.email = email;
		this.fullName = fullName;
		this.passwordHash = passwordHash;
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public UserRole getRole() {
		return role;
	}

	public UserStatus getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setStatus(UserStatus status) {
		this.status = status;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}
}
