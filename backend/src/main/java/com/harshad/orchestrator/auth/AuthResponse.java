package com.harshad.orchestrator.auth;

import java.time.Instant;

public record AuthResponse(
	String tokenType,
	String accessToken,
	Instant expiresAt,
	AuthUserResponse user
) {
}
