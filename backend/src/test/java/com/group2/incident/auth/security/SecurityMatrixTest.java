package com.group2.incident.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.group2.incident.auth.entity.AppUser;
import com.group2.incident.auth.entity.Role;
import com.group2.incident.auth.repository.AppUserRepository;
import com.group2.incident.support.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import java.time.Clock;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@IntegrationTest
public class SecurityMatrixTest {

	private static final String DEFAULT_PASSWORD = "DevPassw0rd!";

	@Autowired
	private MockMvc mvc;

	@Autowired
	private AppUserRepository users;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private Clock clock;

	@Autowired
	@Qualifier("requestMappingHandlerMapping")
	private RequestMappingHandlerMapping handlerMapping;

	private String adminToken;

	private String engineerToken;

	private String viewerToken;

	private Long targetUserId;

	public record MatrixRow(
			String name,
			HttpMethod method,
			String pathTemplate,
			String bodyTemplate,
			int adminStatus,
			int engineerStatus,
			int viewerStatus,
			int unauthenticatedStatus
	) {
		@Override
		public String toString() {
			return name;
		}
	}

	public static Stream<MatrixRow> matrixRows() {
		return Stream.of(
				new MatrixRow(
						"POST /api/auth/login",
						HttpMethod.POST,
						"/api/auth/login",
						"{\"username\":\"admin\",\"password\":\"" + DEFAULT_PASSWORD + "\"}",
						200, 200, 200, 200
				),
				new MatrixRow(
						"GET /api/auth/me",
						HttpMethod.GET,
						"/api/auth/me",
						null,
						200, 200, 200, 401
				),
				new MatrixRow(
						"POST /api/auth/logout",
						HttpMethod.POST,
						"/api/auth/logout",
						null,
						204, 204, 204, 401
				),
				new MatrixRow(
						"GET /api/users",
						HttpMethod.GET,
						"/api/users",
						null,
						200, 403, 403, 401
				),
				new MatrixRow(
						"POST /api/users",
						HttpMethod.POST,
						"/api/users",
						"{\"username\":\"sec_${RANDOM}\",\"displayName\":\"Sec User\",\"password\":\"ValidPass123!\",\"role\":\"ENGINEER\"}",
						201, 403, 403, 401
				),
				new MatrixRow(
						"PUT /api/users/{id}/role",
						HttpMethod.PUT,
						"/api/users/{id}/role",
						"{\"role\":\"ENGINEER\"}",
						200, 403, 403, 401
				)
		);
	}

	@BeforeEach
	void setUp() throws Exception {
		createUser("admin", Role.ADMIN);
		createUser("engineer", Role.ENGINEER);
		createUser("viewer", Role.VIEWER);
		AppUser target = createUser("target", Role.VIEWER);
		targetUserId = target.getId();

		adminToken = tokenFor("admin");
		engineerToken = tokenFor("engineer");
		viewerToken = tokenFor("viewer");
	}

	@Test
	void failsIfNewEndpointIsAddedWithoutItsRule() {
		Set<String> declaredEndpoints = new HashSet<>();
		matrixRows().forEach(r -> declaredEndpoints.add(r.method().name() + " " + r.pathTemplate()));

		Set<String> registeredApiEndpoints = new HashSet<>();
		for (RequestMappingInfo info : handlerMapping.getHandlerMethods().keySet()) {
			Set<RequestMethod> methods = info.getMethodsCondition().getMethods();
			Set<String> patterns = info.getPathPatternsCondition() != null
					? info.getPathPatternsCondition().getPatternValues()
					: info.getDirectPaths();

			for (String pattern : patterns) {
				if (pattern.startsWith("/api/")) {
					for (RequestMethod method : methods) {
						registeredApiEndpoints.add(method.name() + " " + pattern);
					}
				}
			}
		}

		assertThat(declaredEndpoints)
				.as("Every registered /api endpoint must be covered in SecurityMatrixTest. Missing rules: %s",
						registeredApiEndpoints.stream().filter(e -> !declaredEndpoints.contains(e)).toList())
				.containsAll(registeredApiEndpoints);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("matrixRows")
	void endpointSecurityMatrix(MatrixRow row) throws Exception {
		String path = row.pathTemplate().replace("{id}", targetUserId.toString());

		// Admin
		execute(row.method(), path, row.bodyTemplate(), adminToken, row.adminStatus());

		// Engineer
		execute(row.method(), path, row.bodyTemplate(), engineerToken, row.engineerStatus());

		// Viewer
		execute(row.method(), path, row.bodyTemplate(), viewerToken, row.viewerStatus());

		// Unauthenticated
		execute(row.method(), path, row.bodyTemplate(), null, row.unauthenticatedStatus());
	}

	private void execute(HttpMethod method, String path, String bodyTemplate, String token, int expectedStatus) throws Exception {
		MockHttpServletRequestBuilder req = request(method, path);
		if (token != null) {
			req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
		}
		if (bodyTemplate != null) {
			String body = bodyTemplate.replace("${RANDOM}", UUID.randomUUID().toString().substring(0, 8));
			req.contentType(MediaType.APPLICATION_JSON).content(body);
		}
		mvc.perform(req).andExpect(status().is(expectedStatus));
	}

	private AppUser createUser(String username, Role role) {
		return users.saveAndFlush(new AppUser(username, "Test " + username, passwordEncoder.encode(DEFAULT_PASSWORD), role,
				clock.instant()));
	}

	private String tokenFor(String username) throws Exception {
		String body = "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, DEFAULT_PASSWORD);
		String response = mvc.perform(
						request(HttpMethod.POST, "/api/auth/login")
								.contentType(MediaType.APPLICATION_JSON)
								.content(body))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(response, "$.token");
	}
}
