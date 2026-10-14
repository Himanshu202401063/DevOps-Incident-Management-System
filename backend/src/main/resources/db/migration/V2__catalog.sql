-- Service catalog and per-severity SLA targets (D23).

CREATE TABLE service (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(100) NOT NULL,
    description text,
    owner_id    bigint       NOT NULL REFERENCES app_user (id),
    criticality varchar(20)  NOT NULL,
    created_at  timestamptz  NOT NULL,
    updated_at  timestamptz  NOT NULL,
    CONSTRAINT service_name_key UNIQUE (name),
    CONSTRAINT service_criticality_check CHECK (criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX service_owner_idx ON service (owner_id);

-- The admin enters both targets for every severity (D23, still Open: this follows its working default).
CREATE TABLE service_sla_target (
    service_id         bigint      NOT NULL REFERENCES service (id),
    severity           varchar(10) NOT NULL,
    response_minutes   integer     NOT NULL,
    resolution_minutes integer     NOT NULL,
    PRIMARY KEY (service_id, severity),
    CONSTRAINT service_sla_target_severity_check CHECK (severity IN ('SEV1', 'SEV2', 'SEV3', 'SEV4')),
    CONSTRAINT service_sla_target_response_check CHECK (response_minutes > 0),
    CONSTRAINT service_sla_target_resolution_check CHECK (resolution_minutes >= response_minutes)
);
