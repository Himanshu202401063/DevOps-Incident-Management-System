package com.group2.incident.auth;

import java.time.Instant;

public record LoginResponse(String token, Instant expiresAt, UserResponse user) {
}
