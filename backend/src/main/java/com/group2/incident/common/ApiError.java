package com.group2.incident.common;

import java.util.Map;

/** The one error shape every endpoint returns; {@code errors} maps a field name to its message. */
public record ApiError(int status, String message, Map<String, String> errors) {
}
