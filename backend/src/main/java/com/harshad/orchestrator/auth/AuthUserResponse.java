package com.harshad.orchestrator.auth;

import java.time.Instant;
import java.util.UUID;

public record AuthUserResponse(
	UUID id,
	String email,
	String fullName,
	UserRole role,
	UserStatus status,
	Instant createdAt
) {

	public static AuthUserResponse from(UserAccount user) {
		return new AuthUserResponse(
			user.getId(),
			user.getEmail(),
			user.getFullName(),
			user.getRole(),
			user.getStatus(),
			user.getCreatedAt()
		);
	}
}
