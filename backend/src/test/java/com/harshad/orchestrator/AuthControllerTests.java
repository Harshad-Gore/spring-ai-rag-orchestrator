package com.harshad.orchestrator;

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
	"app.auth.jwt-secret=test-secret-that-is-long-enough-for-hmac-signing-123456"
})
@AutoConfigureMockMvc
class AuthControllerTests {

	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void signupReturnsTokenAndAuthenticatedUser() throws Exception {
		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
					"fullName", "Avery Stone",
					"email", "avery@example.com",
					"password", "password123"
				))))
			.andExpect(status().isCreated())
			.andExpect((result) -> org.assertj.core.api.Assertions.assertThat(
				result.getResponse().getHeader(HttpHeaders.SET_COOKIE)
			).contains("HttpOnly"))
			.andExpect(jsonPath("$.tokenType").value("Bearer"))
			.andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
			.andExpect(jsonPath("$.user.email").value("avery@example.com"))
			.andExpect(jsonPath("$.user.role").value("USER"));
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
			.andExpect(status().isCreated());

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
			.andExpect(status().isCreated());

		mockMvc.perform(post("/api/auth/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(payload)))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.fields.email").value("An account with this email already exists."));
	}
}
