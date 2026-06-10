package com.harshad.orchestrator.auth;

import java.util.UUID;

public record AuthenticatedUser(
	UUID id,
	String email,
	UserRole role
) {
}
