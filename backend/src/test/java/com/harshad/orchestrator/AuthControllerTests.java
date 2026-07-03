package com.harshad.orchestrator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.harshad.orchestrator.auth.EmailService;
import com.harshad.orchestrator.auth.UserAccount;
import com.harshad.orchestrator.auth.UserAccountRepository;
import com.harshad.orchestrator.auth.UserStatus;

import jakarta.servlet.http.Cookie;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:auth_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.hibernate.ddl-auto=create-drop",
	"spring.flyway.enabled=false",
	"spring.ai.openai.base-url=http://localhost",
	"spring.ai.openai.api-key=test",
	"spring.ai.openai.chat.options.model=test",
	"app.frontend.origins=http://localhost:5173,https://frontend.example.vercel.app",
	"app.auth.jwt-secret=test-secret-that-is-long-enough-for-hmac-signing-123456"
})
@AutoConfigureMockMvc
class AuthControllerTests {

	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserAccountRepository userAccountRepository;

	@MockitoBean
	private EmailService emailService;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void signupCreatesUnverifiedAccountAndRequiresEmailVerification() throws Exception {
		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
					"fullName", "Avery Stone",
					"email", "avery@example.com",
					"password", "password123"
				))))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.message").value("UNVERIFIED_ACCOUNT"));

		UserAccount account = userAccountRepository.findByEmailIgnoreCase("avery@example.com").orElseThrow();
		assertThat(account.getStatus()).isEqualTo(UserStatus.UNVERIFIED);
	}

	@Test
	void corsPreflightAllowsFrontendOriginForAuthenticatedRoutes() throws Exception {
		mockMvc.perform(options("/api/auth/me")
				.header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
	}

	@Test
	void corsPreflightAllowsConfiguredVercelOrigin() throws Exception {
		mockMvc.perform(options("/api/auth/me")
				.header(HttpHeaders.ORIGIN, "https://frontend.example.vercel.app")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://frontend.example.vercel.app"))
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
	}

	@Test
	void healthEndpointIsPublic() throws Exception {
		mockMvc.perform(get("/api/health"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("ok"));
	}

	@Test
	void sessionReturnsUnauthenticatedWithoutFailing() throws Exception {
		mockMvc.perform(get("/api/auth/session"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.authenticated").value(false))
			.andExpect(jsonPath("$.user").doesNotExist());
	}

	@Test
	void loginAllowsDashboardSessionLookup() throws Exception {
		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
					"fullName", "Morgan Lee",
					"email", "morgan@example.com",
					"password", "password123"
				))))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.message").value("UNVERIFIED_ACCOUNT"));

		activateAccount("morgan@example.com");

		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
					"email", "morgan@example.com",
					"password", "password123"
				))))
			.andExpect(status().isOk())
			.andReturn();

		Map<String, Object> loginBody = objectMapper.readValue(
			loginResult.getResponse().getContentAsByteArray(),
			MAP_TYPE
		);

		mockMvc.perform(get("/api/auth/me")
				.cookie(new Cookie("auth_token", (String) loginBody.get("accessToken"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("morgan@example.com"))
			.andExpect(jsonPath("$.fullName").value("Morgan Lee"));

		mockMvc.perform(get("/api/auth/session")
				.cookie(new Cookie("auth_token", (String) loginBody.get("accessToken"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.authenticated").value(true))
			.andExpect(jsonPath("$.user.email").value("morgan@example.com"));
	}

	@Test
	void duplicateSignupReturnsFieldError() throws Exception {
		Map<String, String> payload = Map.of(
			"fullName", "Casey Quinn",
			"email", "casey@example.com",
			"password", "password123"
		);

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload)))
			.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload)))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.fields.email").value("An account with this email already exists."));
	}

	private void activateAccount(String email) {
		UserAccount account = userAccountRepository.findByEmailIgnoreCase(email).orElseThrow();
		account.setStatus(UserStatus.ACTIVE);
		userAccountRepository.save(account);
	}
}
