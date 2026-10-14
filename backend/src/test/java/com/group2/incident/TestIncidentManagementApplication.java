package com.group2.incident;

import com.group2.incident.support.TestcontainersConfiguration;
import org.springframework.boot.SpringApplication;

public class TestIncidentManagementApplication {

	public static void main(String[] args) {
		SpringApplication.from(IncidentManagementApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
