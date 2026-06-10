package com.harshad.orchestrator;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DatabaseUrlInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

	private static final String PROPERTY_SOURCE_NAME = "databaseUrlInitializer";

	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
		ConfigurableEnvironment environment = applicationContext.getEnvironment();
		String datasourceUrl = environment.getProperty("spring.datasource.url");

		if (!isRenderPostgresUrl(datasourceUrl)) {
			return;
		}

		DatabaseConnection databaseConnection = parse(datasourceUrl);
		Map<String, Object> properties = new HashMap<>();
		properties.put("spring.datasource.url", databaseConnection.jdbcUrl());

		if (!hasText(environment.getProperty("SPRING_DATASOURCE_USERNAME")) && databaseConnection.username() != null) {
			properties.put("spring.datasource.username", databaseConnection.username());
		}

		if (!hasText(environment.getProperty("SPRING_DATASOURCE_PASSWORD")) && databaseConnection.password() != null) {
			properties.put("spring.datasource.password", databaseConnection.password());
		}

		environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
	}

	private boolean isRenderPostgresUrl(String value) {
		return value != null && (value.startsWith("postgres://") || value.startsWith("postgresql://"));
	}

	private DatabaseConnection parse(String databaseUrl) {
		URI uri = URI.create(databaseUrl);
		String database = uri.getPath() == null ? "" : uri.getPath();
		if (database.startsWith("/")) {
			database = database.substring(1);
		}

		StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
			.append(uri.getHost());

		if (uri.getPort() > 0) {
			jdbcUrl.append(':').append(uri.getPort());
		}

		jdbcUrl.append('/').append(database);

		if (hasText(uri.getQuery())) {
			jdbcUrl.append('?').append(uri.getQuery());
		}

		String username = null;
		String password = null;
		String userInfo = uri.getUserInfo();
		if (hasText(userInfo)) {
			String[] credentials = userInfo.split(":", 2);
			username = credentials[0];
			if (credentials.length > 1) {
				password = credentials[1];
			}
		}

		return new DatabaseConnection(jdbcUrl.toString(), username, password);
	}

	private boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	private record DatabaseConnection(String jdbcUrl, String username, String password) {
	}
}
