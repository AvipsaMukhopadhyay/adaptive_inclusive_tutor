-- Phase 2: student accounts (login/sign-up) and chapter completion tracking

ALTER TABLE student ADD COLUMN password_hash VARCHAR(100);

-- One account per email. Older rows created before accounts existed have no password and are ignored.
CREATE UNIQUE INDEX ux_student_email ON student (lower(email)) WHERE password_hash IS NOT NULL;

-- Login sessions: only a SHA-256 hash of the token is stored, never the token itself.
CREATE TABLE auth_session (
    token_hash VARCHAR(64) PRIMARY KEY,
    student_id BIGINT    NOT NULL REFERENCES student (id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_auth_session_student ON auth_session (student_id);

-- When the student first mastered the chapter
ALTER TABLE learning_progress ADD COLUMN completed_at TIMESTAMP;

CREATE INDEX idx_answer_log_student ON answer_log (student_id);
