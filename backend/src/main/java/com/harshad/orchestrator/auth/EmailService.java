package com.harshad.orchestrator.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final TemplateEngine templateEngine;

	@Value("${spring.mail.username}")
	private String fromEmail;

	@Value("${app.frontend.url}")
	private String frontendUrl;

	public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
		this.mailSender = mailSender;
		this.templateEngine = templateEngine;
	}

	public void sendVerificationEmail(String toEmail, String name, String token, String origin) {
		try {
			Context context = new Context();
			context.setVariable("name", name);
			String base = (origin != null && !origin.isBlank()) ? origin : frontendUrl;
			if (base != null && base.endsWith("/")) {
				base = base.substring(0, base.length() - 1);
			}
			String verifyUrl = base + "/verify-email?token=" + token;
			context.setVariable("url", verifyUrl);

			String htmlContent = templateEngine.process("verify-email", context);
			sendHtmlEmail(toEmail, "Verify your email address", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send verification email to {}", toEmail, e);
		}
	}

	public void sendPasswordResetEmail(String toEmail, String name, String token, String origin) {
		try {
			Context context = new Context();
			context.setVariable("name", name);
			String base = (origin != null && !origin.isBlank()) ? origin : frontendUrl;
			if (base != null && base.endsWith("/")) {
				base = base.substring(0, base.length() - 1);
			}
			String resetUrl = base + "/reset-password?token=" + token;
			context.setVariable("url", resetUrl);

			String htmlContent = templateEngine.process("reset-password", context);
			sendHtmlEmail(toEmail, "Reset your password", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send password reset email to {}", toEmail, e);
		}
	}

	public void sendWelcomeEmail(String toEmail, String name, String origin) {
		try {
			Context context = new Context();
			context.setVariable("name", name);
			String base = (origin != null && !origin.isBlank()) ? origin : frontendUrl;
			if (base != null && base.endsWith("/")) {
				base = base.substring(0, base.length() - 1);
			}
			context.setVariable("url", base); // link to dashboard

			String htmlContent = templateEngine.process("welcome", context);
			sendHtmlEmail(toEmail, "Welcome to Notebook!", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send welcome email to {}", toEmail, e);
		}
	}

	public void sendPasswordChangedEmail(String toEmail, String name) {
		try {
			Context context = new Context();
			context.setVariable("name", name);

			String htmlContent = templateEngine.process("password-changed", context);
			sendHtmlEmail(toEmail, "Your password has been changed", htmlContent);
		} catch (Exception e) {
			log.error("Failed to send password changed email to {}", toEmail, e);
		}
	}

	private void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
		MimeMessage message = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
		helper.setFrom(fromEmail);
		helper.setTo(to);
		helper.setSubject(subject);
		helper.setText(htmlBody, true);
		mailSender.send(message);
		log.info("Email sent to: {} with subject: {}", to, subject);
	}
}
