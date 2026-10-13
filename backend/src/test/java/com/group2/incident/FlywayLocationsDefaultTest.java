package com.group2.incident;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;
import org.junit.jupiter.api.Test;

/**
 * Dev seed data is opt-in (D27). If the default location ever included db/devdata, a deploy
 * without FLYWAY_LOCATIONS would create the dev users in production.
 */
class FlywayLocationsDefaultTest {

	@Test
	void defaultLocationIsMigrationsOnly() throws IOException {
		Properties properties = new Properties();
		try (InputStream in = getClass().getResourceAsStream("/application.properties")) {
			properties.load(in);
		}

		assertThat(properties.getProperty("spring.flyway.locations"))
				.isEqualTo("${FLYWAY_LOCATIONS:classpath:db/migration}");
	}

}
