package com.harshad.orchestrator.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
	@NotBlank(message = "Full name is required.")
	@Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters.")
	String fullName,

	@NotBlank(message = "Email is required.")
	@Email(message = "Use a valid email address.")
	@Size(max = 320, message = "Email must be 320 characters or fewer.")
	String email,

	@NotBlank(message = "Password is required.")
	@Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters.")
	String password
) {
}
