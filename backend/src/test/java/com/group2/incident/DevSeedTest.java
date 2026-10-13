package com.group2.incident;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

/**
 * The dev seed loads only when its location is named explicitly (D27). This class opts in, which
 * gives it its own application context and therefore its own PostgreSQL container; the other
 * integration tests stay seed-free.
 */
@IntegrationTest
@TestPropertySource(properties = "spring.flyway.locations=classpath:db/migration,classpath:db/devdata")
class DevSeedTest {

	@Autowired
	private JdbcTemplate jdbc;

	@Test
	void seedRunsAsARepeatableMigrationWhenOptedIn() {
		Map<String, Object> row = jdbc.queryForMap(
				"select description, success from flyway_schema_history where version is null and type = 'SQL'");

		assertThat(row).containsEntry("description", "dev seed").containsEntry("success", true);
	}

	@Test
	void seedCreatesOneEnabledUserPerRole() {
		List<String> users = jdbc.queryForList("""
				select username || ':' || role || ':' || enabled || ':' || token_version
				from app_user order by username""", String.class);

		assertThat(users).containsExactly("admin:ADMIN:true:0", "engineer:ENGINEER:true:0", "viewer:VIEWER:true:0");
	}

	@Test
	void seedPasswordIsDevPassw0rd() {
		PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();

		for (String hash : jdbc.queryForList("select password_hash from app_user", String.class)) {
			assertThat(encoder.matches("DevPassw0rd!", hash)).isTrue();
		}
	}

	@Test
	void seedRegistersPaymentsWithTargets() {
		Map<String, Object> service = jdbc.queryForMap("""
				select s.criticality, u.username as owner
				from service s join app_user u on u.id = s.owner_id
				where s.name = 'Payments'""");
		List<String> targets = jdbc.queryForList("""
				select t.severity || ':' || t.response_minutes || ':' || t.resolution_minutes
				from service_sla_target t join service s on s.id = t.service_id
				where s.name = 'Payments' order by t.severity""", String.class);

		assertThat(service).containsEntry("criticality", "CRITICAL").containsEntry("owner", "admin");
		assertThat(targets).containsExactly("SEV1:15:240", "SEV2:60:480", "SEV3:240:2880", "SEV4:1440:10080");
	}

	@Test
	void seedIsIdempotent() throws IOException {
		String counts = "select (select count(*) from app_user) || '/' || (select count(*) from service)"
				+ " || '/' || (select count(*) from service_sla_target)";
		String before = jdbc.queryForObject(counts, String.class);

		jdbc.execute(new ClassPathResource("db/devdata/R__dev_seed.sql").getContentAsString(StandardCharsets.UTF_8));

		assertThat(jdbc.queryForObject(counts, String.class)).isEqualTo(before).isEqualTo("3/1/4");
	}

}
