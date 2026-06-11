package com.harshad.orchestrator.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
	@NotBlank(message = "Full name is required")
	@Size(max = 120, message = "Full name must not exceed 120 characters")
	String fullName,

	@Size(max = 1024, message = "Avatar URL must not exceed 1024 characters")
	String avatarUrl
) {
}
