package com.group2.incident.auth;

import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Production starts without the dev seed, so nobody could log in. When BOOTSTRAP_ADMIN_USERNAME and
 * BOOTSTRAP_ADMIN_PASSWORD are set and the database has no users yet, this creates the first admin.
 * Once any user exists it does nothing, so the variables can stay set.
 */
@Component
class BootstrapAdmin implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(BootstrapAdmin.class);

	private final AppUserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final Clock clock;

	private final String username;

	private final String password;

	BootstrapAdmin(AppUserRepository users, PasswordEncoder passwordEncoder, Clock clock,
			@Value("${app.bootstrap-admin.username}") String username,
			@Value("${app.bootstrap-admin.password}") String password) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
		this.username = username;
		this.password = password;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (username.isBlank() || password.isBlank()) {
			return;
		}
		if (password.length() < 8 || password.length() > 72) {
			throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must be 8 to 72 characters");
		}
		if (users.count() > 0) {
			return;
		}
		users.save(new AppUser(username, "Administrator", passwordEncoder.encode(password), Role.ADMIN, clock.instant()));
		log.info("Created the first admin, {}", username);
	}

}
