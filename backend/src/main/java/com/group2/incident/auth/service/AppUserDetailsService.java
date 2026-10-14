package com.group2.incident.auth.service;

import com.group2.incident.auth.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Used only by login, to check the password. Requests with a token go through {@link JwtUserConverter}. */
@Service
@RequiredArgsConstructor
class AppUserDetailsService implements UserDetailsService {

	private final AppUserRepository users;

	@Override
	public UserDetails loadUserByUsername(String username) {
		return users.findByUsername(username)
				.map(user -> User.withUsername(user.getUsername())
						.password(user.getPasswordHash())
						.roles(user.getRole().name())
						.disabled(!user.isEnabled())
						.build())
				.orElseThrow(() -> new UsernameNotFoundException("Unknown user"));
	}

}
