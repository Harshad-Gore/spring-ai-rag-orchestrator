package com.harshad.orchestrator.config;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DatabaseMigrationConfig {

	private static final String DATABASE_MIGRATION_BEAN = "databaseMigration";
	private static final String ENTITY_MANAGER_FACTORY_BEAN = "entityManagerFactory";

	@Bean(name = DATABASE_MIGRATION_BEAN)
	public MigrateResult migrateDatabase(
			DataSource dataSource,
			@Value("${spring.flyway.locations:classpath:db/migration}") String locations,
			@Value("${spring.flyway.baseline-on-migrate:false}") boolean baselineOnMigrate) {
		cleanStaleFlywayHistory(dataSource);
		Flyway flyway = Flyway.configure()
			.dataSource(dataSource)
			.locations(parseLocations(locations))
			.baselineOnMigrate(baselineOnMigrate)
			.load();
		flyway.repair();
		return flyway.migrate();
	}

	private void cleanStaleFlywayHistory(DataSource dataSource) {
		try (var conn = dataSource.getConnection();
			 var stmt = conn.createStatement()) {
			stmt.execute("""
				DELETE FROM flyway_schema_history
				WHERE version IN ('2', '3')
				AND description IN ('create notebooks', 'create documents')
			""");
		} catch (Exception ignored) {
			// Table may not exist on first run — safe to ignore
		}
	}

	@Bean
	public static BeanFactoryPostProcessor entityManagerFactoryDependsOnDatabaseMigration() {
		return (beanFactory) -> addDependsOn(beanFactory, ENTITY_MANAGER_FACTORY_BEAN, DATABASE_MIGRATION_BEAN);
	}

	private static void addDependsOn(
			ConfigurableListableBeanFactory beanFactory,
			String beanName,
			String dependencyName) {
		if (!beanFactory.containsBeanDefinition(beanName)) {
			return;
		}

		BeanDefinition beanDefinition = beanFactory.getBeanDefinition(beanName);
		Set<String> dependsOn = new LinkedHashSet<>();
		if (beanDefinition.getDependsOn() != null) {
			dependsOn.addAll(Arrays.asList(beanDefinition.getDependsOn()));
		}
		dependsOn.add(dependencyName);
		beanDefinition.setDependsOn(dependsOn.toArray(String[]::new));
	}

	private String[] parseLocations(String locations) {
		return Arrays.stream(locations.split(","))
			.map(String::trim)
			.filter((location) -> !location.isBlank())
			.toArray(String[]::new);
	}
}
