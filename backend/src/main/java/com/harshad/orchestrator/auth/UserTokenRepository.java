package com.harshad.orchestrator.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {
	Optional<UserToken> findByTokenAndTokenType(String token, UserToken.TokenType tokenType);
	void deleteByUserIdAndTokenType(UUID userId, UserToken.TokenType tokenType);
}
