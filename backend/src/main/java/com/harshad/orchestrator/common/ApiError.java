package com.harshad.orchestrator.common;

import java.time.Instant;
import java.util.Map;

public record ApiError(
	Instant timestamp,
	int status,
	String message,
	Map<String, String> fields
) {

	public static ApiError of(int status, String message) {
		return new ApiError(Instant.now(), status, message, Map.of());
	}

	public static ApiError withFields(int status, String message, Map<String, String> fields) {
		return new ApiError(Instant.now(), status, message, fields);
	}
}
