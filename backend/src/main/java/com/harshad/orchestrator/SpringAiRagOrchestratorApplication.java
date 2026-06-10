package com.harshad.orchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringAiRagOrchestratorApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(SpringAiRagOrchestratorApplication.class);
		application.addInitializers(new DatabaseUrlInitializer());
		application.run(args);
	}

}
