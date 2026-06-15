package com.harshad.orchestrator.config;

import javax.sql.DataSource;
import java.sql.Connection;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.pgvector.PGvector;

@Configuration
public class DatabaseConfig {

    @Bean
    public org.springframework.boot.jdbc.DataSourceBuilder<?> dataSourceBuilder(javax.sql.DataSource dataSource) {
        return org.springframework.boot.jdbc.DataSourceBuilder.derivedFrom(dataSource);
    }
}
