package com.harshad.orchestrator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:migration_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.hibernate.ddl-auto=none",
	"spring.flyway.enabled=true",
	"spring.flyway.locations=classpath:test-migration",
	"spring.ai.openai.base-url=http://localhost",
	"spring.ai.openai.api-key=test",
	"spring.ai.vectorstore.pgvector.initialize-schema=false",
	"app.auth.jwt-secret=test-secret-that-is-long-enough-for-hmac-signing-123456"
})
class DatabaseMigrationConfigTests {
	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void migrationsRunBeforeJpaSchemaValidation() {
		Integer tableCount = jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'app_users'",
			Integer.class
		);
		assertThat(tableCount).isEqualTo(1);
	}
}
