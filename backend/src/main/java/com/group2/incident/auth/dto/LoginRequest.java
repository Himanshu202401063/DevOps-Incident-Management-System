package com.group2.incident.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
		@NotBlank(message = "Username is required") @Size(max = 50, message = "Username is at most 50 characters") String username,
		@NotBlank(message = "Password is required") @Size(max = 72, message = "Password is at most 72 characters") String password) {
}
