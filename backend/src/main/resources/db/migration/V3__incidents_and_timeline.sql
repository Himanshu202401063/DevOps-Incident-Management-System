-- Incidents and their append-only timeline.

CREATE TABLE incident (
    id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title                     varchar(200) NOT NULL,
    description               text         NOT NULL,
    service_id                bigint       NOT NULL REFERENCES service (id),
    severity                  varchar(10)  NOT NULL,
    status                    varchar(20)  NOT NULL,
    -- Null when the system created the incident, e.g. from an alert (FR-03.4).
    reporter_id               bigint       REFERENCES app_user (id),
    assignee_id               bigint       REFERENCES app_user (id),
    created_at                timestamptz  NOT NULL,
    -- Copied from the service at creation and never changed afterwards.
    response_target_minutes   integer      NOT NULL,
    resolution_target_minutes integer      NOT NULL,
    version                   bigint       NOT NULL DEFAULT 0,
    CONSTRAINT incident_severity_check CHECK (severity IN ('SEV1', 'SEV2', 'SEV3', 'SEV4')),
    -- Which transitions are legal is decided in Java; the database only knows the values.
    CONSTRAINT incident_status_check CHECK (status IN
        ('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED', 'CLOSED')),
    CONSTRAINT incident_response_target_check CHECK (response_target_minutes > 0),
    CONSTRAINT incident_resolution_target_check CHECK (resolution_target_minutes >= response_target_minutes)
);

CREATE INDEX incident_service_idx ON incident (service_id);
CREATE INDEX incident_created_idx ON incident (created_at DESC, id DESC);
CREATE INDEX incident_status_idx ON incident (status);
CREATE INDEX incident_reporter_idx ON incident (reporter_id);
CREATE INDEX incident_assignee_idx ON incident (assignee_id);

CREATE TABLE timeline_entry (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id       bigint      NOT NULL REFERENCES incident (id),
    -- Null when the system acted rather than a user, e.g. an escalation (FR-08.2).
    actor_id          bigint      REFERENCES app_user (id),
    -- Codes such as INCIDENT_CREATED. The values belong to the Java enum; the database checks the form.
    event_type        varchar(50) NOT NULL,
    details           text        NOT NULL,
    recorded_at       timestamptz NOT NULL,
    -- A correction is a new entry pointing at the one it corrects.
    corrects_entry_id bigint,
    CONSTRAINT timeline_entry_event_type_check CHECK (event_type ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT timeline_entry_incident_entry_key UNIQUE (incident_id, id),
    -- The corrected entry must belong to the same incident. A null corrects_entry_id skips the check.
    CONSTRAINT timeline_entry_corrects_entry_id_fkey
        FOREIGN KEY (incident_id, corrects_entry_id) REFERENCES timeline_entry (incident_id, id)
);

CREATE INDEX timeline_entry_incident_idx ON timeline_entry (incident_id, recorded_at, id);
CREATE INDEX timeline_entry_actor_idx ON timeline_entry (actor_id);

CREATE TRIGGER timeline_entry_append_only
    BEFORE UPDATE OR DELETE ON timeline_entry
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_change();

CREATE TRIGGER timeline_entry_no_truncate
    BEFORE TRUNCATE ON timeline_entry
    FOR EACH STATEMENT EXECUTE FUNCTION reject_append_only_change();
