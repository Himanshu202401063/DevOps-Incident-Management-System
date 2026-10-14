package com.group2.incident.auth.security;

import com.group2.incident.auth.entity.AppUser;
import com.group2.incident.auth.repository.AppUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Runs on every request whose token has a valid signature. Refuses the token if the user is gone, is
 * disabled, or has logged out since it was issued, and takes the role from the database, not the token.
 */
@Component
@RequiredArgsConstructor
public class JwtUserConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	public static final String TOKEN_VERSION = "tv";

	private final AppUserRepository users;

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		AppUser user = users.findById(Long.valueOf(jwt.getSubject()))
				.filter(AppUser::isEnabled)
				// Numbers in a JWT decode as Long.
				.filter(u -> jwt.getClaim(TOKEN_VERSION) instanceof Number version && version.intValue() == u.getTokenVersion())
				.orElseThrow(() -> new InvalidBearerTokenException("Token is no longer valid"));
		return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
	}

}
