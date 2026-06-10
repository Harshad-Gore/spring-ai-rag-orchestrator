package com.harshad.orchestrator.auth;

public record AuthSessionResponse(
	boolean authenticated,
	AuthUserResponse user
) {

	public static AuthSessionResponse authenticated(AuthUserResponse user) {
		return new AuthSessionResponse(true, user);
	}

	public static AuthSessionResponse unauthenticated() {
		return new AuthSessionResponse(false, null);
	}
}
