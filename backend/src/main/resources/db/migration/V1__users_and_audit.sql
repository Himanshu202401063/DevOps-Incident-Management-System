-- Users and the configuration audit log.
-- Names are unqualified; Flyway runs with search_path = incident (D26).

-- "user" is reserved in PostgreSQL, hence app_user.
CREATE TABLE app_user (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      varchar(50)  NOT NULL,
    display_name  varchar(100) NOT NULL,
    -- Delegating encoder format, e.g. {bcrypt}$2a$10$...
    password_hash varchar(100) NOT NULL,
    role          varchar(20)  NOT NULL,
    enabled       boolean      NOT NULL DEFAULT true,
    -- Carried in the JWT; logout or a role change increments it (D21).
    token_version integer      NOT NULL DEFAULT 0,
    created_at    timestamptz  NOT NULL,
    CONSTRAINT app_user_role_check CHECK (role IN ('ADMIN', 'ENGINEER', 'VIEWER'))
);

-- Usernames are unique regardless of case: "Admin" and "admin" are the same user. Look them up
-- with lower(username) = lower(?) so this index applies.
CREATE UNIQUE INDEX app_user_username_key ON app_user (lower(username));

-- Rejects any change to an append-only table. Corrections are new rows, never edits.
CREATE FUNCTION reject_append_only_change() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE TABLE audit_entry (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Assumption pending team confirmation: always a user in Sprint 1. System actors, if needed,
    -- arrive with a later migration that drops NOT NULL.
    actor_id    bigint      NOT NULL REFERENCES app_user (id),
    action      varchar(50) NOT NULL,
    item_type   varchar(50) NOT NULL,
    -- Polymorphic reference to the changed item, so no foreign key.
    item_id     bigint      NOT NULL,
    details     text        NOT NULL,
    recorded_at timestamptz NOT NULL
);

CREATE INDEX audit_entry_item_idx ON audit_entry (item_type, item_id);

CREATE TRIGGER audit_entry_append_only
    BEFORE UPDATE OR DELETE ON audit_entry
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_change();
