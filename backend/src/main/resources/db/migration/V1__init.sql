-- Adaptive Inclusive Smart Tutor: initial schema (phase 1)

CREATE TABLE student (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(200) NOT NULL,
    phone         VARCHAR(30),
    grade         INT          NOT NULL,
    board         VARCHAR(60)  NOT NULL,
    learner_type  VARCHAR(20)  NOT NULL,          -- NORMAL | SPECIAL_NEEDS
    special_needs TEXT,                           -- comma-separated, e.g. "DYSLEXIA,ADHD"
    other_needs   TEXT,                           -- free text when "Other" is selected
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE subject (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(80) NOT NULL,
    grade INT         NOT NULL,
    icon  VARCHAR(16),
    UNIQUE (name, grade)
);

CREATE TABLE chapter (
    id            BIGSERIAL PRIMARY KEY,
    subject_id    BIGINT       NOT NULL REFERENCES subject (id),
    chapter_name  VARCHAR(160) NOT NULL,
    chapter_order INT          NOT NULL,
    explanation   TEXT,
    key_points    TEXT,        -- JSON array of short sentences
    examples      TEXT,        -- JSON array of {title, content, visual}
    activity      TEXT,
    UNIQUE (subject_id, chapter_order)
);

CREATE TABLE question (
    id          BIGSERIAL PRIMARY KEY,
    chapter_id  BIGINT      NOT NULL REFERENCES chapter (id),
    difficulty  VARCHAR(10) NOT NULL,             -- EASY | MEDIUM | HARD
    prompt      TEXT        NOT NULL,
    options     TEXT,                             -- JSON array; empty => free-text answer
    answer      TEXT        NOT NULL,             -- accepted answers separated by '|'
    hint        TEXT,
    explanation TEXT
);
CREATE INDEX idx_question_chapter_difficulty ON question (chapter_id, difficulty);

CREATE TABLE learning_progress (
    id                  BIGSERIAL PRIMARY KEY,
    student_id          BIGINT      NOT NULL REFERENCES student (id),
    chapter_id          BIGINT      NOT NULL REFERENCES chapter (id),
    questions_attempted INT         NOT NULL DEFAULT 0,
    correct_answers     INT         NOT NULL DEFAULT 0,
    incorrect_answers   INT         NOT NULL DEFAULT 0,
    total_attempts      INT         NOT NULL DEFAULT 0,
    total_time_seconds  INT         NOT NULL DEFAULT 0,
    current_difficulty  VARCHAR(10) NOT NULL DEFAULT 'EASY',
    learning_state      VARCHAR(60),                -- last RL state key
    correct_streak      INT         NOT NULL DEFAULT 0,
    pending_state       VARCHAR(60),                -- RL state when the current activity was chosen
    pending_action      VARCHAR(40),                -- RL action that produced the current activity
    pending_question_id BIGINT,
    updated_at          TIMESTAMP   NOT NULL DEFAULT now(),
    UNIQUE (student_id, chapter_id)
);

-- One row per finished question (used to compute recent performance / pace)
CREATE TABLE answer_log (
    id                 BIGSERIAL PRIMARY KEY,
    student_id         BIGINT      NOT NULL REFERENCES student (id),
    chapter_id         BIGINT      NOT NULL REFERENCES chapter (id),
    question_id        BIGINT      NOT NULL REFERENCES question (id),
    difficulty         VARCHAR(10) NOT NULL,
    correct            BOOLEAN     NOT NULL,
    attempts           INT         NOT NULL,
    time_taken_seconds INT         NOT NULL,
    rl_state           VARCHAR(60),
    rl_action          VARCHAR(40),
    reward             DOUBLE PRECISION,
    created_at         TIMESTAMP   NOT NULL DEFAULT now()
);
CREATE INDEX idx_answer_log_student_chapter ON answer_log (student_id, chapter_id, created_at DESC);

-- Per-student Q-table: the tutor learns each student's pace separately
CREATE TABLE q_value (
    id         BIGSERIAL PRIMARY KEY,
    student_id BIGINT           NOT NULL REFERENCES student (id),
    state_key  VARCHAR(60)      NOT NULL,
    action     VARCHAR(40)      NOT NULL,
    q_value    DOUBLE PRECISION NOT NULL,
    visits     INT              NOT NULL DEFAULT 0,
    UNIQUE (student_id, state_key, action)
);
