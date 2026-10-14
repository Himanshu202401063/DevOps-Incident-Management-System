package com.group2.incident.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

	// lower() on both sides, so the case-insensitive unique index from V1 applies.
	@Query("select u from AppUser u where lower(u.username) = lower(:username)")
	Optional<AppUser> findByUsername(String username);

}
