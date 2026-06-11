package com.harshad.orchestrator.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final TemplateEngine templateEngine;

	@Value("${spring.mail.username}")
	private String fromEmail;

	@Value("${spring.mail.host}")
	private String mailHost;

	@Value("${spring.mail.port}")
	private int mailPort;

	@Value("${app.frontend.url}")
	private String frontendUrl;

	@Value("${app.resend.api-key:}")
	private String resendApiKey;

	public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
		this.mailSender = mailSender;
		this.templateEngine = templateEngine;
	}

	@PostConstruct
	public void logMailConfig() {
		if (isResendEnabled()) {
			log.info("Email service initialized: provider=RESEND, from={}", fromEmail);
		} else {
			log.info("Email service initialized: provider=SMTP, host={}, port={}, from={}", mailHost, mailPort, fromEmail);
		}
	}

	private boolean isResendEnabled() {
		return resendApiKey != null && !resendApiKey.isBlank();
	}

	public void sendVerificationEmail(String toEmail, String name, String token, String origin) {
		Context context = new Context();
		context.setVariable("name", name);
		String base = resolveBaseUrl(origin);
		String verifyUrl = base + "/verify-email?token=" + token;
		context.setVariable("url", verifyUrl);

		String htmlContent = templateEngine.process("verify-email", context);
		sendEmail(toEmail, "Verify your email address", htmlContent);
	}

	public void sendPasswordResetEmail(String toEmail, String name, String token, String origin) {
		Context context = new Context();
		context.setVariable("name", name);
		String base = resolveBaseUrl(origin);
		String resetUrl = base + "/reset-password?token=" + token;
		context.setVariable("url", resetUrl);

		String htmlContent = templateEngine.process("reset-password", context);
		sendEmail(toEmail, "Reset your password", htmlContent);
	}

	public void sendWelcomeEmail(String toEmail, String name, String origin) {
		try {
			Context context = new Context();
			context.setVariable("name", name);
			context.setVariable("url", resolveBaseUrl(origin));

			String htmlContent = templateEngine.process("welcome", context);
			sendEmail(toEmail, "Welcome to Notebook!", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send welcome email to {}", toEmail, e);
		}
	}

	public void sendPasswordChangedEmail(String toEmail, String name) {
		try {
			Context context = new Context();
			context.setVariable("name", name);

			String htmlContent = templateEngine.process("password-changed", context);
			sendEmail(toEmail, "Your password has been changed", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send password changed email to {}", toEmail, e);
		}
	}

	private String resolveBaseUrl(String origin) {
		String base = (origin != null && !origin.isBlank()) ? origin : frontendUrl;
		if (base != null && base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		return base;
	}

	private void sendEmail(String to, String subject, String htmlBody) {
		if (isResendEnabled()) {
			sendViaResend(to, subject, htmlBody);
		} else {
			sendViaSmtp(to, subject, htmlBody);
		}
	}

	private void sendViaResend(String to, String subject, String htmlBody) {
		try {
			// Escape JSON special characters in the HTML body
			String escapedHtml = htmlBody
				.replace("\\", "\\\\")
				.replace("\"", "\\\"")
				.replace("\n", "\\n")
				.replace("\r", "\\r")
				.replace("\t", "\\t");

			String jsonBody = String.format(
				"{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
				"Notebook <onboarding@resend.dev>", to, subject, escapedHtml
			);

			HttpClient client = HttpClient.newHttpClient();
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create("https://api.resend.com/emails"))
				.header("Authorization", "Bearer " + resendApiKey)
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(jsonBody))
				.build();

			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

			if (response.statusCode() >= 200 && response.statusCode() < 300) {
				log.info("Email sent via Resend to: {} | subject: {} | response: {}", to, subject, response.body());
			} else {
				log.error("Resend API error: status={} body={}", response.statusCode(), response.body());
				throw new RuntimeException("Resend API returned " + response.statusCode() + ": " + response.body());
			}
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			log.error("EMAIL SEND FAILED (Resend) to: {} | subject: {} | error: {}", to, subject, e.getMessage(), e);
			throw new RuntimeException("Failed to send email via Resend to " + to + ": " + e.getMessage(), e);
		}
	}

	private void sendViaSmtp(String to, String subject, String htmlBody) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(fromEmail);
			helper.setTo(to);
			helper.setSubject(subject);
			helper.setText(htmlBody, true);
			mailSender.send(message);
			log.info("Email sent via SMTP to: {} | subject: {}", to, subject);
		} catch (Exception e) {
			log.error("EMAIL SEND FAILED (SMTP) to: {} | host: {}:{} | from: {} | error: {}",
				to, mailHost, mailPort, fromEmail, e.getMessage(), e);
			throw new RuntimeException("Failed to send email via SMTP to " + to + ": " + e.getMessage(), e);
		}
	}
}
