-- Incidents and their append-only timeline.

CREATE TABLE incident (
    id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title                     varchar(200) NOT NULL,
    description               text         NOT NULL,
    service_id                bigint       NOT NULL REFERENCES service (id),
    severity                  varchar(10)  NOT NULL,
    status                    varchar(20)  NOT NULL,
    -- Assumption pending team confirmation: always a user in Sprint 1. Alert-created
    -- incidents, if they need no reporter, arrive with a later migration.
    reporter_id               bigint       NOT NULL REFERENCES app_user (id),
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

CREATE TABLE timeline_entry (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id       bigint      NOT NULL REFERENCES incident (id),
    -- Assumption pending team confirmation: always a user in Sprint 1 (see audit_entry).
    actor_id          bigint      NOT NULL REFERENCES app_user (id),
    event_type        varchar(50) NOT NULL,
    details           text        NOT NULL,
    recorded_at       timestamptz NOT NULL,
    -- A correction is a new entry pointing at the one it corrects.
    corrects_entry_id bigint,
    CONSTRAINT timeline_entry_incident_entry_key UNIQUE (incident_id, id),
    -- The corrected entry must belong to the same incident. A null corrects_entry_id skips the check.
    CONSTRAINT timeline_entry_corrects_entry_id_fkey
        FOREIGN KEY (incident_id, corrects_entry_id) REFERENCES timeline_entry (incident_id, id),
    CONSTRAINT timeline_entry_no_self_correction CHECK (corrects_entry_id <> id)
);

CREATE INDEX timeline_entry_incident_idx ON timeline_entry (incident_id, recorded_at, id);

CREATE TRIGGER timeline_entry_append_only
    BEFORE UPDATE OR DELETE ON timeline_entry
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_change();
