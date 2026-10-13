package com.group2.incident;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Checks the Flyway schema directly with SQL, below the application. Each test makes at most one
 * statement that is expected to fail: PostgreSQL aborts the transaction after an error, and the
 * test rollback cleans up either way.
 */
@IntegrationTest
class DatabaseSchemaTest {

	private static final List<String> TABLES =
			List.of("app_user", "audit_entry", "service", "service_sla_target", "incident", "timeline_entry");

	@Autowired
	private JdbcTemplate jdbc;

	// Migration execution

	@Test
	void versionedMigrationsApplyInOrder() {
		List<String> versions = jdbc.queryForList(
				"select version from flyway_schema_history where version is not null order by installed_rank", String.class);
		Boolean allSucceeded = jdbc.queryForObject("select bool_and(success) from flyway_schema_history", Boolean.class);

		assertThat(versions).containsExactly("1", "2", "3");
		assertThat(allSucceeded).isTrue();
	}

	@Test
	void tablesLiveInTheIncidentSchemaNotPublic() {
		for (String table : TABLES) {
			assertThat(jdbc.queryForObject("select to_regclass(?) is not null", Boolean.class, "incident." + table))
					.as("incident.%s exists", table).isTrue();
			assertThat(jdbc.queryForObject("select to_regclass(?) is null", Boolean.class, "public." + table))
					.as("public.%s absent", table).isTrue();
		}
	}

	@Test
	void defaultRunLoadsNoDevSeed() {
		Integer repeatables = jdbc.queryForObject(
				"select count(*) from flyway_schema_history where version is null and type = 'SQL'", Integer.class);
		Integer users = jdbc.queryForObject("select count(*) from app_user", Integer.class);
		Integer services = jdbc.queryForObject("select count(*) from service", Integer.class);

		assertThat(repeatables).isZero();
		assertThat(users).isZero();
		assertThat(services).isZero();
	}

	// app_user

	@Test
	void newUserGetsDefaults() {
		long id = insertUser("asha");

		assertThat(jdbc.queryForObject("select enabled from app_user where id = ?", Boolean.class, id)).isTrue();
		assertThat(jdbc.queryForObject("select token_version from app_user where id = ?", Integer.class, id)).isZero();
	}

	@Test
	void unknownRoleIsRejected() {
		assertThatThrownBy(() -> jdbc.update("""
				insert into app_user (username, display_name, password_hash, role, created_at)
				values ('asha', 'Asha', '{noop}x', 'OWNER', now())"""))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("app_user_role_check");
	}

	@Test
	void duplicateUsernameIsRejected() {
		insertUser("asha");

		assertThatThrownBy(() -> insertUser("asha"))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("app_user_username_key");
	}

	@Test
	void referencedUserCannotBeDeleted() {
		long actor = insertUser("asha");
		insertAudit(actor);

		assertThatThrownBy(() -> jdbc.update("delete from app_user where id = ?", actor))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("audit_entry_actor_id_fkey");
	}

	// audit_entry

	@Test
	void auditEntryRejectsUnknownActor() {
		assertThatThrownBy(() -> insertAudit(-1))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("audit_entry_actor_id_fkey");
	}

	@Test
	void auditEntryCannotBeUpdated() {
		long entry = insertAudit(insertUser("asha"));

		assertThatThrownBy(() -> jdbc.update("update audit_entry set details = 'changed' where id = ?", entry))
				.isInstanceOf(DataAccessException.class)
				.hasMessageContaining("audit_entry is append-only");
	}

	@Test
	void auditEntryCannotBeDeleted() {
		long entry = insertAudit(insertUser("asha"));

		assertThatThrownBy(() -> jdbc.update("delete from audit_entry where id = ?", entry))
				.isInstanceOf(DataAccessException.class)
				.hasMessageContaining("audit_entry is append-only");
	}

	// service

	@Test
	void unknownCriticalityIsRejected() {
		long owner = insertUser("asha");

		assertThatThrownBy(() -> insertService("Payments", owner, "URGENT"))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_criticality_check");
	}

	@Test
	void criticalityIsRequired() {
		long owner = insertUser("asha");

		assertThatThrownBy(() -> insertService("Payments", owner, null))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("criticality");
	}

	@Test
	void ownerIsRequired() {
		assertThatThrownBy(() -> insertService("Payments", null, "HIGH"))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("owner_id");
	}

	@Test
	void unknownOwnerIsRejected() {
		assertThatThrownBy(() -> insertService("Payments", -1L, "HIGH"))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_owner_id_fkey");
	}

	@Test
	void duplicateServiceNameIsRejected() {
		long owner = insertUser("asha");
		insertService("Payments", owner, "HIGH");

		assertThatThrownBy(() -> insertService("Payments", owner, "LOW"))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_name_key");
	}

	@Test
	void referencedServiceCannotBeDeleted() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");
		insertTarget(service, "SEV1", 15, 240);

		assertThatThrownBy(() -> jdbc.update("delete from service where id = ?", service))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_service_id_fkey");
	}

	// service_sla_target

	@Test
	void slaTargetAcceptsEverySeverity() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");
		for (String severity : List.of("SEV1", "SEV2", "SEV3", "SEV4")) {
			insertTarget(service, severity, 15, 240);
		}

		assertThat(jdbc.queryForObject("select count(*) from service_sla_target where service_id = ?", Integer.class, service))
				.isEqualTo(4);
	}

	@Test
	void slaTargetRejectsUnknownSeverity() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");

		assertThatThrownBy(() -> insertTarget(service, "SEV5", 15, 240))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_severity_check");
	}

	@Test
	void slaTargetRejectsZeroResponse() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");

		assertThatThrownBy(() -> insertTarget(service, "SEV1", 0, null))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_response_check");
	}

	@Test
	void slaTargetResolutionIsOptional() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");
		insertTarget(service, "SEV1", 15, null);

		assertThat(jdbc.queryForObject(
				"select resolution_minutes from service_sla_target where service_id = ?", Integer.class, service)).isNull();
	}

	@Test
	void slaTargetResolutionMayEqualResponse() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");
		insertTarget(service, "SEV1", 15, 15);

		assertThat(jdbc.queryForObject(
				"select resolution_minutes from service_sla_target where service_id = ?", Integer.class, service)).isEqualTo(15);
	}

	@Test
	void slaTargetResolutionBelowResponseIsRejected() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");

		assertThatThrownBy(() -> insertTarget(service, "SEV1", 15, 14))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_resolution_check");
	}

	@Test
	void slaTargetIsOnePerSeverity() {
		long service = insertService("Payments", insertUser("asha"), "HIGH");
		insertTarget(service, "SEV1", 15, 240);

		assertThatThrownBy(() -> insertTarget(service, "SEV1", 30, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_pkey");
	}

	@Test
	void slaTargetRejectsUnknownService() {
		assertThatThrownBy(() -> insertTarget(-1, "SEV1", 15, 240))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("service_sla_target_service_id_fkey");
	}

	// incident

	@ParameterizedTest
	@ValueSource(strings = { "OPEN", "ACKNOWLEDGED", "INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED", "CLOSED" })
	void incidentAcceptsEveryStatus(String status) {
		Fixture f = fixture();

		long id = insertIncident(f.service, f.user, "SEV2", status, 60, 480);

		assertThat(jdbc.queryForObject("select status from incident where id = ?", String.class, id)).isEqualTo(status);
	}

	@Test
	void newIncidentStartsAtVersionZeroWithNoAssignee() {
		Fixture f = fixture();

		long id = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);

		assertThat(jdbc.queryForObject("select version from incident where id = ?", Long.class, id)).isZero();
		assertThat(jdbc.queryForObject("select assignee_id from incident where id = ?", Long.class, id)).isNull();
	}

	@Test
	void incidentRejectsUnknownStatus() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, f.user, "SEV2", "REOPENED", 60, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_status_check");
	}

	@Test
	void incidentRejectsUnknownSeverity() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, f.user, "SEV0", "OPEN", 60, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_severity_check");
	}

	@Test
	void incidentRequiresTitle() {
		Fixture f = fixture();

		assertThatThrownBy(() -> jdbc.update("""
				insert into incident (title, description, service_id, severity, status, reporter_id, created_at,
				                      response_target_minutes)
				values (null, 'Checkout failing', ?, 'SEV2', 'OPEN', ?, now(), 60)""", f.service, f.user))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("title");
	}

	@Test
	void incidentRequiresReporter() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, null, "SEV2", "OPEN", 60, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("reporter_id");
	}

	@Test
	void incidentRejectsUnknownService() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(-1L, f.user, "SEV2", "OPEN", 60, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_service_id_fkey");
	}

	@Test
	void incidentRejectsUnknownReporter() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, -1L, "SEV2", "OPEN", 60, 480))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_reporter_id_fkey");
	}

	@Test
	void incidentRejectsUnknownAssignee() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);

		// incident has no append-only trigger; assignment is an ordinary update.
		assertThatThrownBy(() -> jdbc.update("update incident set assignee_id = -1 where id = ?", incident))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_assignee_id_fkey");
	}

	@Test
	void incidentRejectsZeroResponseTarget() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, f.user, "SEV2", "OPEN", 0, null))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_response_target_check");
	}

	@Test
	void incidentResolutionTargetIsOptional() {
		Fixture f = fixture();

		long id = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, null);

		assertThat(jdbc.queryForObject("select resolution_target_minutes from incident where id = ?", Integer.class, id))
				.isNull();
	}

	@Test
	void incidentResolutionTargetMayEqualResponseTarget() {
		Fixture f = fixture();

		long id = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 60);

		assertThat(jdbc.queryForObject("select resolution_target_minutes from incident where id = ?", Integer.class, id))
				.isEqualTo(60);
	}

	@Test
	void incidentResolutionTargetBelowResponseTargetIsRejected() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 59))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("incident_resolution_target_check");
	}

	@Test
	void incidentWithTimelineCannotBeDeleted() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);
		insertEntry(incident, f.user, null);

		assertThatThrownBy(() -> jdbc.update("delete from incident where id = ?", incident))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("timeline_entry_incident_id_fkey");
	}

	// timeline_entry

	@Test
	void correctionLinksToTheOriginalEntry() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);
		long original = insertEntry(incident, f.user, null);

		long correction = insertEntry(incident, f.user, original);

		assertThat(jdbc.queryForObject("select corrects_entry_id from timeline_entry where id = ?", Long.class, correction))
				.isEqualTo(original);
	}

	@Test
	void timelineEntryRejectsUnknownIncident() {
		Fixture f = fixture();

		assertThatThrownBy(() -> insertEntry(-1, f.user, null))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("timeline_entry_incident_id_fkey");
	}

	@Test
	void timelineEntryRejectsUnknownActor() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);

		assertThatThrownBy(() -> insertEntry(incident, -1, null))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("timeline_entry_actor_id_fkey");
	}

	@Test
	void timelineEntryRejectsUnknownCorrectedEntry() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);

		assertThatThrownBy(() -> insertEntry(incident, f.user, -1L))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("timeline_entry_corrects_entry_id_fkey");
	}

	@Test
	void timelineEntryCannotCorrectItself() {
		Fixture f = fixture();
		long incident = insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480);

		// The id is generated, so supplying it is the only way to make an entry point at itself.
		assertThatThrownBy(() -> jdbc.update("""
				insert into timeline_entry (id, incident_id, actor_id, event_type, details, recorded_at, corrects_entry_id)
				overriding system value
				values (999999, ?, ?, 'COMMENT', 'Note', now(), 999999)""", incident, f.user))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("timeline_entry_no_self_correction");
	}

	@Test
	void timelineEntryCannotBeUpdated() {
		Fixture f = fixture();
		long entry = insertEntry(insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480), f.user, null);

		assertThatThrownBy(() -> jdbc.update("update timeline_entry set details = 'changed' where id = ?", entry))
				.isInstanceOf(DataAccessException.class)
				.hasMessageContaining("timeline_entry is append-only");
	}

	@Test
	void timelineEntryCannotBeDeleted() {
		Fixture f = fixture();
		long entry = insertEntry(insertIncident(f.service, f.user, "SEV2", "OPEN", 60, 480), f.user, null);

		assertThatThrownBy(() -> jdbc.update("delete from timeline_entry where id = ?", entry))
				.isInstanceOf(DataAccessException.class)
				.hasMessageContaining("timeline_entry is append-only");
	}

	// Fixtures

	private record Fixture(long user, long service) {
	}

	private Fixture fixture() {
		long user = insertUser("asha");
		return new Fixture(user, insertService("Payments", user, "HIGH"));
	}

	private long insertUser(String username) {
		return jdbc.queryForObject("""
				insert into app_user (username, display_name, password_hash, role, created_at)
				values (?, ?, '{noop}x', 'ENGINEER', now()) returning id""", Long.class, username, username);
	}

	private long insertAudit(long actorId) {
		return jdbc.queryForObject("""
				insert into audit_entry (actor_id, action, item_type, item_id, details, recorded_at)
				values (?, 'USER_CREATED', 'USER', 1, 'Created', now()) returning id""", Long.class, actorId);
	}

	private long insertService(String name, Long ownerId, String criticality) {
		return jdbc.queryForObject("""
				insert into service (name, owner_id, criticality, created_at, updated_at)
				values (?, ?, ?, now(), now()) returning id""", Long.class, name, ownerId, criticality);
	}

	private void insertTarget(long serviceId, String severity, int responseMinutes, Integer resolutionMinutes) {
		jdbc.update("""
				insert into service_sla_target (service_id, severity, response_minutes, resolution_minutes)
				values (?, ?, ?, ?)""", serviceId, severity, responseMinutes, resolutionMinutes);
	}

	private long insertIncident(Long serviceId, Long reporterId, String severity, String status,
			int responseTarget, Integer resolutionTarget) {
		return jdbc.queryForObject("""
				insert into incident (title, description, service_id, severity, status, reporter_id, created_at,
				                      response_target_minutes, resolution_target_minutes)
				values ('Checkout failing', 'Card payments time out', ?, ?, ?, ?, now(), ?, ?) returning id""",
				Long.class, serviceId, severity, status, reporterId, responseTarget, resolutionTarget);
	}

	private long insertEntry(long incidentId, long actorId, Long correctsEntryId) {
		return jdbc.queryForObject("""
				insert into timeline_entry (incident_id, actor_id, event_type, details, recorded_at, corrects_entry_id)
				values (?, ?, 'COMMENT', 'Looking at the gateway logs', now(), ?) returning id""",
				Long.class, incidentId, actorId, correctsEntryId);
	}

}
