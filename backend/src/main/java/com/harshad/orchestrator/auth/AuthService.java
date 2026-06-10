package com.harshad.orchestrator.auth;

import java.util.Locale;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final UserAccountRepository userAccountRepository;

	public AuthService(
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			UserAccountRepository userAccountRepository) {
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.userAccountRepository = userAccountRepository;
	}

	@Transactional
	public AuthResponse signup(SignupRequest request) {
		String email = normalizeEmail(request.email());
		if (userAccountRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException("An account with this email already exists.");
		}

		UserAccount user = new UserAccount(
			email,
			request.fullName().trim(),
			passwordEncoder.encode(request.password())
		);

		return createAuthResponse(userAccountRepository.save(user));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
			.orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new DisabledException("This account is disabled.");
		}

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new BadCredentialsException("Invalid email or password.");
		}

		return createAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public AuthUserResponse currentUser(AuthenticatedUser principal) {
		UserAccount user = userAccountRepository.findById(principal.id())
			.orElseThrow(() -> new BadCredentialsException("Invalid authentication token."));
		return AuthUserResponse.from(user);
	}

	private AuthResponse createAuthResponse(UserAccount user) {
		JwtService.IssuedToken token = jwtService.issue(user);
		return new AuthResponse("Bearer", token.value(), token.expiresAt(), AuthUserResponse.from(user));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
