package com.harshad.orchestrator.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class JwtService {

	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	private final AuthProperties authProperties;
	private final ObjectMapper objectMapper;
	private final byte[] secretBytes;

	public JwtService(AuthProperties authProperties) {
		this.authProperties = authProperties;
		this.objectMapper = new ObjectMapper();
		if (!StringUtils.hasText(authProperties.getJwtSecret())
				|| authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalStateException("AUTH_JWT_SECRET must be at least 32 bytes.");
		}
		this.secretBytes = authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8);
	}

	public IssuedToken issue(UserAccount user) {
		Instant issuedAt = Instant.now();
		Instant expiresAt = issuedAt.plus(authProperties.getTokenTtl());

		Map<String, Object> header = Map.of(
			"alg", "HS256",
			"typ", "JWT"
		);
		Map<String, Object> claims = new LinkedHashMap<>();
		claims.put("iss", authProperties.getIssuer());
		claims.put("sub", user.getId().toString());
		claims.put("email", user.getEmail());
		claims.put("name", user.getFullName());
		claims.put("role", user.getRole().name());
		claims.put("iat", issuedAt.getEpochSecond());
		claims.put("exp", expiresAt.getEpochSecond());

		String unsignedToken = encodeJson(header) + "." + encodeJson(claims);
		return new IssuedToken(unsignedToken + "." + sign(unsignedToken), expiresAt);
	}

	public Optional<AuthenticatedUser> verify(String token) {
		try {
			String[] parts = token.split("\\.");
			if (parts.length != 3) {
				return Optional.empty();
			}

			String unsignedToken = parts[0] + "." + parts[1];
			if (!MessageDigest.isEqual(sign(unsignedToken).getBytes(StandardCharsets.UTF_8),
					parts[2].getBytes(StandardCharsets.UTF_8))) {
				return Optional.empty();
			}

			Map<String, Object> header = decodeJson(parts[0]);
			if (!"HS256".equals(header.get("alg"))) {
				return Optional.empty();
			}

			Map<String, Object> claims = decodeJson(parts[1]);
			if (!authProperties.getIssuer().equals(claims.get("iss"))) {
				return Optional.empty();
			}

			Number expiresAt = (Number) claims.get("exp");
			if (expiresAt == null || Instant.now().getEpochSecond() >= expiresAt.longValue()) {
				return Optional.empty();
			}

			return Optional.of(new AuthenticatedUser(
				UUID.fromString((String) claims.get("sub")),
				(String) claims.get("email"),
				UserRole.valueOf((String) claims.get("role"))
			));
		}
		catch (RuntimeException ex) {
			return Optional.empty();
		}
	}

	private String encodeJson(Map<String, Object> value) {
		try {
			return Base64.getUrlEncoder()
				.withoutPadding()
				.encodeToString(objectMapper.writeValueAsBytes(value));
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to encode JWT payload.", ex);
		}
	}

	private Map<String, Object> decodeJson(String value) {
		try {
			byte[] decoded = Base64.getUrlDecoder().decode(value);
			return objectMapper.readValue(decoded, MAP_TYPE);
		}
		catch (Exception ex) {
			throw new IllegalArgumentException("Unable to decode JWT payload.", ex);
		}
	}

	private String sign(String value) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
			return Base64.getUrlEncoder()
				.withoutPadding()
				.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to sign JWT.", ex);
		}
	}

	public record IssuedToken(String value, Instant expiresAt) {
	}
}
