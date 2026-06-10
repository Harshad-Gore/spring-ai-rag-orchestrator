package com.harshad.orchestrator.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.harshad.orchestrator.auth.DuplicateEmailException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> fields = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors().forEach((error) ->
			fields.putIfAbsent(error.getField(), error.getDefaultMessage())
		);
		return ResponseEntity.badRequest()
			.body(ApiError.withFields(HttpStatus.BAD_REQUEST.value(), "Validation failed.", fields));
	}

	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<ApiError> handleDuplicateEmail(DuplicateEmailException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(ApiError.withFields(
				HttpStatus.CONFLICT.value(),
				ex.getMessage(),
				Map.of("email", ex.getMessage())
			));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
			.body(ApiError.of(HttpStatus.UNAUTHORIZED.value(), ex.getMessage()));
	}

	@ExceptionHandler(DisabledException.class)
	public ResponseEntity<ApiError> handleDisabledAccount(DisabledException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
			.body(ApiError.of(HttpStatus.FORBIDDEN.value(), ex.getMessage()));
	}
}
