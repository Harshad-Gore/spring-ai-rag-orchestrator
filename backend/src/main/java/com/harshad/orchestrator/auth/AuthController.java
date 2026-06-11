package com.harshad.orchestrator.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthProperties authProperties;
	private final AuthService authService;

	public AuthController(AuthProperties authProperties, AuthService authService) {
		this.authProperties = authProperties;
		this.authService = authService;
	}

	@PostMapping("/signup")
	public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletRequest httpRequest) {
		AuthResponse response = authService.signup(request, getClientOrigin(httpRequest));
		return ResponseEntity.status(HttpStatus.CREATED)
			.header(HttpHeaders.SET_COOKIE, createAuthCookie(response).toString())
			.body(response);
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
		AuthResponse response = authService.login(request, getClientOrigin(httpRequest));
		return ResponseEntity.ok()
			.header(HttpHeaders.SET_COOKIE, createAuthCookie(response).toString())
			.body(response);
	}

	@GetMapping("/me")
	public AuthUserResponse me(Authentication authentication) {
		return authService.currentUser((AuthenticatedUser) authentication.getPrincipal());
	}

	@PutMapping("/me")
	public AuthUserResponse updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
		return authService.updateProfile((AuthenticatedUser) authentication.getPrincipal(), request);
	}

	@GetMapping("/session")
	public AuthSessionResponse session(Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
			return AuthSessionResponse.unauthenticated();
		}

		return AuthSessionResponse.authenticated(authService.currentUser(principal));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout() {
		return ResponseEntity.noContent()
			.header(HttpHeaders.SET_COOKIE, clearAuthCookie().toString())
			.build();
	}

	@PostMapping("/verify-email")
	public ResponseEntity<Void> verifyEmail(@RequestBody TokenRequest request, HttpServletRequest httpRequest) {
		authService.verifyEmail(request.token(), getClientOrigin(httpRequest));
		return ResponseEntity.ok().build();
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<Void> forgotPassword(@RequestBody EmailRequest request, HttpServletRequest httpRequest) {
		authService.forgotPassword(request.email(), getClientOrigin(httpRequest));
		return ResponseEntity.ok().build();
	}

	@PostMapping("/reset-password")
	public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request.token(), request.password());
		return ResponseEntity.ok().build();
	}

	public record TokenRequest(String token) {}
	public record EmailRequest(String email) {}
	public record ResetPasswordRequest(String token, String password) {}

	private String getClientOrigin(HttpServletRequest request) {
		String origin = request.getHeader("Origin");
		if (origin == null || origin.isBlank()) {
			origin = request.getHeader("Referer");
		}
		if (origin != null && origin.endsWith("/")) {
			origin = origin.substring(0, origin.length() - 1);
		}
		return origin;
	}

	private ResponseCookie createAuthCookie(AuthResponse response) {
		Duration maxAge = Duration.between(Instant.now(), response.expiresAt());
		return ResponseCookie.from(authProperties.getCookieName(), response.accessToken())
			.httpOnly(true)
			.secure(authProperties.isCookieSecure())
			.sameSite(authProperties.getCookieSameSite())
			.path("/")
			.maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge)
			.build();
	}

	private ResponseCookie clearAuthCookie() {
		return ResponseCookie.from(authProperties.getCookieName(), "")
			.httpOnly(true)
			.secure(authProperties.isCookieSecure())
			.sameSite(authProperties.getCookieSameSite())
			.path("/")
			.maxAge(Duration.ZERO)
			.build();
	}
}
