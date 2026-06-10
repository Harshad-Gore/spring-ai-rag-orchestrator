package com.harshad.orchestrator;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:migration_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.hibernate.ddl-auto=validate",
	"spring.flyway.enabled=true",
	"spring.flyway.locations=classpath:test-migration",
	"spring.ai.openai.base-url=http://localhost",
	"spring.ai.openai.api-key=test",
	"spring.ai.openai.chat.options.model=test",
	"app.auth.jwt-secret=test-secret-that-is-long-enough-for-hmac-signing-123456"
})
class DatabaseMigrationConfigTests {

	@Test
	void migrationsRunBeforeJpaSchemaValidation() {
	}
}
