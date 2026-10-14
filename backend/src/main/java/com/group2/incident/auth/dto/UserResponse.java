package com.group2.incident.auth.dto;

import com.group2.incident.auth.entity.AppUser;
import com.group2.incident.auth.entity.Role;

public record UserResponse(Long id, String username, String displayName, Role role) {

	public static UserResponse from(AppUser user) {
		return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole());
	}

}
