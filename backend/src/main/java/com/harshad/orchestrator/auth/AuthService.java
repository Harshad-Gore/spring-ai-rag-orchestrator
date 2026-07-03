package com.harshad.orchestrator.auth;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
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

	@Value("${app.signup.enabled:true}")
	private boolean signupEnabled;

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
		if (!signupEnabled) {
			throw new IllegalArgumentException("We are not accepting new users at this time. If you already have an account, please log in.");
		}

		String email = normalizeEmail(request.email());
		if (userAccountRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException("An account with this email already exists.");
		}

		UserAccount user = new UserAccount(
			email,
			request.fullName().trim(),
			passwordEncoder.encode(request.password())
		);
		user.setStatus(UserStatus.ACTIVE);
		user = userAccountRepository.save(user);
		return createAuthResponse(user);
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
			.orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

		if (user.getStatus() == UserStatus.DISABLED) {
			throw new DisabledException("This account is disabled.");
		}

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new BadCredentialsException("Invalid email or password.");
		}

		// Accounts created before email verification was retired are upgraded only
		// after their password has been validated successfully.
		if (user.getStatus() == UserStatus.UNVERIFIED) {
			user.setStatus(UserStatus.ACTIVE);
			user = userAccountRepository.save(user);
		}

		return createAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public AuthUserResponse currentUser(AuthenticatedUser principal) {
		UserAccount user = userAccountRepository.findById(principal.id())
			.orElseThrow(() -> new IllegalStateException("Authenticated user not found in DB"));
		return AuthUserResponse.from(user);
	}

	@Transactional
	public AuthUserResponse updateProfile(AuthenticatedUser principal, UpdateProfileRequest request) {
		UserAccount user = userAccountRepository.findById(principal.id())
			.orElseThrow(() -> new IllegalStateException("Authenticated user not found in DB"));
		
		user.setFullName(request.fullName().trim());
		if (request.avatarUrl() != null) {
			user.setAvatarUrl(request.avatarUrl().trim().isEmpty() ? null : request.avatarUrl().trim());
		}

		userAccountRepository.save(user);
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
