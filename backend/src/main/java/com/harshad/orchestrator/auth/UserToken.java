package com.harshad.orchestrator.auth;

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
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
	name = "user_tokens",
	indexes = {
		@Index(name = "idx_user_tokens_token", columnList = "token"),
		@Index(name = "idx_user_tokens_user_id", columnList = "user_id")
	}
)
public class UserToken {

	public enum TokenType {
		VERIFY_EMAIL,
		RESET_PASSWORD
	}

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id", nullable = false, updatable = false, columnDefinition = "uuid")
	private UUID id;

	@Column(name = "user_id", nullable = false, columnDefinition = "uuid")
	private UUID userId;

	@Column(name = "token", nullable = false, length = 100, unique = true)
	private String token;

	@Enumerated(EnumType.STRING)
	@Column(name = "token_type", nullable = false, length = 32)
	private TokenType tokenType;

	@Column(name = "expiry_date", nullable = false)
	private Instant expiryDate;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected UserToken() {
	}

	public UserToken(UUID userId, String token, TokenType tokenType, Instant expiryDate) {
		this.userId = userId;
		this.token = token;
		this.tokenType = tokenType;
		this.expiryDate = expiryDate;
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getToken() {
		return token;
	}

	public TokenType getTokenType() {
		return tokenType;
	}

	public Instant getExpiryDate() {
		return expiryDate;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
