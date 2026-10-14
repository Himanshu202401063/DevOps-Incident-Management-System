package com.group2.incident.auth;

public record UserResponse(Long id, String username, String displayName, Role role) {

	public static UserResponse from(AppUser user) {
		return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole());
	}

}
