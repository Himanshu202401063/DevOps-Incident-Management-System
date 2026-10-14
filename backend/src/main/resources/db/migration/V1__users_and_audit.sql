-- Users and the configuration audit log.
-- Names are unqualified; Flyway runs with search_path = incident (D26).

-- "user" is reserved in PostgreSQL, hence app_user.
CREATE TABLE app_user (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      varchar(50)  NOT NULL,
    display_name  varchar(100) NOT NULL,
    -- Delegating encoder format: {bcrypt}... is 68 characters, while {argon2@...} and {pbkdf2@...}
    -- are about 125, so the encoder can be upgraded without a migration.
    password_hash varchar(255) NOT NULL,
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
    -- Null when the system acted rather than a user, e.g. an escalation (FR-13.2).
    actor_id    bigint      REFERENCES app_user (id),
    -- Codes such as USER_CREATED. The values belong to the Java enums; the database checks the form.
    action      varchar(50) NOT NULL,
    item_type   varchar(50) NOT NULL,
    -- Polymorphic reference to the changed item, so no foreign key.
    item_id     bigint      NOT NULL,
    details     text        NOT NULL,
    recorded_at timestamptz NOT NULL,
    CONSTRAINT audit_entry_action_check CHECK (action ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT audit_entry_item_type_check CHECK (item_type ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE INDEX audit_entry_item_idx ON audit_entry (item_type, item_id);
CREATE INDEX audit_entry_actor_idx ON audit_entry (actor_id);

CREATE TRIGGER audit_entry_append_only
    BEFORE UPDATE OR DELETE ON audit_entry
    FOR EACH ROW EXECUTE FUNCTION reject_append_only_change();

CREATE TRIGGER audit_entry_no_truncate
    BEFORE TRUNCATE ON audit_entry
    FOR EACH STATEMENT EXECUTE FUNCTION reject_append_only_change();
