package com.harshad.orchestrator.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private static final Logger log = LoggerFactory.getLogger(AuthService.class);

	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final UserAccountRepository userAccountRepository;
	private final UserTokenRepository userTokenRepository;
	private final EmailService emailService;

	public AuthService(
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			UserAccountRepository userAccountRepository,
			UserTokenRepository userTokenRepository,
			EmailService emailService) {
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.userAccountRepository = userAccountRepository;
		this.userTokenRepository = userTokenRepository;
		this.emailService = emailService;
	}

	@Transactional(noRollbackFor = {UnverifiedUserException.class, RuntimeException.class})
	public AuthResponse signup(SignupRequest request, String origin) {
		String email = normalizeEmail(request.email());
		if (userAccountRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException("An account with this email already exists.");
		}

		UserAccount user = new UserAccount(
			email,
			request.fullName().trim(),
			passwordEncoder.encode(request.password())
		);
		user.setStatus(UserStatus.UNVERIFIED);
		user = userAccountRepository.save(user);

		String token = generateToken();
		UserToken userToken = new UserToken(
			user.getId(),
			token,
			UserToken.TokenType.VERIFY_EMAIL,
			Instant.now().plus(24, ChronoUnit.HOURS)
		);
		userTokenRepository.save(userToken);

		try {
			emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token, origin);
		} catch (Exception e) {
			log.error("Signup succeeded but email delivery failed for {}: {}", user.getEmail(), e.getMessage());
		}

		// Don't log them in yet, throw an exception so the frontend knows to show "check email"
		throw new UnverifiedUserException("UNVERIFIED_ACCOUNT");
	}

	@Transactional(noRollbackFor = {UnverifiedUserException.class, RuntimeException.class})
	public AuthResponse login(LoginRequest request, String origin) {
		UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
			.orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

		if (user.getStatus() == UserStatus.UNVERIFIED) {
			// Issue a new token and resend email
			userTokenRepository.deleteByUserIdAndTokenType(user.getId(), UserToken.TokenType.VERIFY_EMAIL);
			String token = generateToken();
			UserToken userToken = new UserToken(
				user.getId(),
				token,
				UserToken.TokenType.VERIFY_EMAIL,
				Instant.now().plus(24, ChronoUnit.HOURS)
			);
			userTokenRepository.save(userToken);

			try {
				emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token, origin);
			} catch (Exception e) {
				log.error("Login re-verify but email delivery failed for {}: {}", user.getEmail(), e.getMessage());
			}

			throw new UnverifiedUserException("UNVERIFIED_ACCOUNT");
		}

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

	@Transactional
	public void verifyEmail(String token, String origin) {
		UserToken userToken = userTokenRepository.findByTokenAndTokenType(token, UserToken.TokenType.VERIFY_EMAIL)
			.orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token."));

		if (userToken.getExpiryDate().isBefore(Instant.now())) {
			userTokenRepository.delete(userToken);
			throw new IllegalArgumentException("Verification token has expired. Please log in to request a new one.");
		}

		UserAccount user = userAccountRepository.findById(userToken.getUserId())
			.orElseThrow(() -> new IllegalArgumentException("User not found."));

		user.setStatus(UserStatus.ACTIVE);
		userAccountRepository.save(user);
		userTokenRepository.deleteByUserIdAndTokenType(user.getId(), UserToken.TokenType.VERIFY_EMAIL);

		emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), origin);
	}

	@Transactional
	public void forgotPassword(String email, String origin) {
		userAccountRepository.findByEmailIgnoreCase(normalizeEmail(email)).ifPresent(user -> {
			userTokenRepository.deleteByUserIdAndTokenType(user.getId(), UserToken.TokenType.RESET_PASSWORD);
			String token = generateToken();
			UserToken userToken = new UserToken(
				user.getId(),
				token,
				UserToken.TokenType.RESET_PASSWORD,
				Instant.now().plus(1, ChronoUnit.HOURS)
			);
			userTokenRepository.save(userToken);
			emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token, origin);
		});
	}

	@Transactional
	public void resetPassword(String token, String newPassword) {
		UserToken userToken = userTokenRepository.findByTokenAndTokenType(token, UserToken.TokenType.RESET_PASSWORD)
			.orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token."));

		if (userToken.getExpiryDate().isBefore(Instant.now())) {
			userTokenRepository.delete(userToken);
			throw new IllegalArgumentException("Password reset token has expired. Please request a new one.");
		}

		UserAccount user = userAccountRepository.findById(userToken.getUserId())
			.orElseThrow(() -> new IllegalArgumentException("User not found."));

		user.setPasswordHash(passwordEncoder.encode(newPassword));
		userAccountRepository.save(user);
		userTokenRepository.deleteByUserIdAndTokenType(user.getId(), UserToken.TokenType.RESET_PASSWORD);

		emailService.sendPasswordChangedEmail(user.getEmail(), user.getFullName());
	}

	private String generateToken() {
		return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
	}

	private AuthResponse createAuthResponse(UserAccount user) {
		JwtService.IssuedToken token = jwtService.issue(user);
		return new AuthResponse("Bearer", token.value(), token.expiresAt(), AuthUserResponse.from(user));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
