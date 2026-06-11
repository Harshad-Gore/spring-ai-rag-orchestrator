package com.harshad.orchestrator.auth;

import org.springframework.security.core.AuthenticationException;

public class UnverifiedUserException extends AuthenticationException {
	public UnverifiedUserException(String msg) {
		super(msg);
	}
}
