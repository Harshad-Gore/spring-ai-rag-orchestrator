package com.harshad.orchestrator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.context.support.GenericApplicationContext;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:context_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
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
class SpringAiRagOrchestratorApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void renderPostgresUrlIsConvertedToJdbcProperties() {
		MockEnvironment environment = new MockEnvironment()
			.withProperty(
				"spring.datasource.url",
				"postgresql://deploy_user:p%40ssword@db.internal:5432/orchestrator?sslmode=require"
			);
		GenericApplicationContext context = new GenericApplicationContext();
		context.setEnvironment(environment);

		new DatabaseUrlInitializer().initialize(context);

		assertThat(environment.getProperty("spring.datasource.url"))
			.isEqualTo("jdbc:postgresql://db.internal:5432/orchestrator?sslmode=require");
		assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("deploy_user");
		assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("p@ssword");
	}

}
