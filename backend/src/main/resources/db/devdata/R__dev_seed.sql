-- Development data only. Flyway loads this file only when FLYWAY_LOCATIONS includes
-- classpath:db/devdata (D27); production and the default test run never see it.
-- Every user's password is DevPassw0rd!
-- Repeatable and idempotent: rows that already exist are left as they are.

INSERT INTO app_user (username, display_name, password_hash, role, created_at)
VALUES ('admin',    'Dev Admin',    '{bcrypt}$2a$10$VIfFAxI6UFgBeWMdFEvAp.16koHo8wb8LRuqky0e47iWLefM5Huwm', 'ADMIN',    now()),
       ('engineer', 'Dev Engineer', '{bcrypt}$2a$10$VIfFAxI6UFgBeWMdFEvAp.16koHo8wb8LRuqky0e47iWLefM5Huwm', 'ENGINEER', now()),
       ('viewer',   'Dev Viewer',   '{bcrypt}$2a$10$VIfFAxI6UFgBeWMdFEvAp.16koHo8wb8LRuqky0e47iWLefM5Huwm', 'VIEWER',   now())
ON CONFLICT ((lower(username))) DO NOTHING;

INSERT INTO service (name, description, owner_id, criticality, created_at, updated_at)
SELECT 'Payments', 'Card and wallet payments', id, 'CRITICAL', now(), now()
FROM app_user
WHERE username = 'admin'
ON CONFLICT (name) DO NOTHING;

INSERT INTO service_sla_target (service_id, severity, response_minutes, resolution_minutes)
SELECT s.id, t.severity, t.response_minutes, t.resolution_minutes
FROM service s
CROSS JOIN (VALUES ('SEV1', 15, 240),
                   ('SEV2', 60, 480),
                   ('SEV3', 240, 2880),
                   ('SEV4', 1440, 10080)) AS t (severity, response_minutes, resolution_minutes)
WHERE s.name = 'Payments'
ON CONFLICT (service_id, severity) DO NOTHING;
