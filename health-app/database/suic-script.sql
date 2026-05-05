-- Tabla de usuarios
CREATE TABLE users (
    id bigint primary key generated always as identity,
    first_name text NOT NULL,
    last_name text NOT NULL,
    username text NOT NULL,
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    age integer NOT NULL,
    gender text CHECK (gender IN ('male', 'female', 'non-binary', 'other')) NOT NULL,
    consent_accepted boolean NOT NULL
);

-- Tabla de contactos de emergencia
CREATE TABLE emergency_contacts (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES users(id),
    full_name text NOT NULL,
    phone_number text NOT NULL,
    contact_type text CHECK (contact_type IN ('Therapist', 'Primary', 'Secondary')) NOT NULL
);

-- Tabla de estados de ánimo
CREATE TABLE mood_states (
    id bigint primary key generated always as identity,
    name text NOT NULL UNIQUE
);

-- Tabla de diarios
CREATE TABLE diaries (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES users(id),
    entry_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Tabla intermedia para diarios y estados de ánimo
CREATE TABLE diary_mood_states (
    diary_id bigint NOT NULL REFERENCES diaries(id),
    mood_state_id bigint NOT NULL REFERENCES mood_states(id),
    rating integer CHECK (rating >= 0 AND rating <= 10),
    PRIMARY KEY (diary_id, mood_state_id)
);

-- Tabla de comportamientos
CREATE TABLE behaviors (
    id bigint primary key generated always as identity,
    name text NOT NULL UNIQUE
);

-- Tabla intermedia para diarios y comportamientos
CREATE TABLE diary_behaviors (
    diary_id bigint NOT NULL REFERENCES diaries(id),
    behavior_id bigint NOT NULL REFERENCES behaviors(id),
    PRIMARY KEY (diary_id, behavior_id)
);

-- Tabla de reflexiones
CREATE TABLE reflections (
    id bigint primary key generated always as identity,
    diary_id bigint NOT NULL REFERENCES diaries(id),
    most_difficult_today text NOT NULL,
    most_helpful_today text NOT NULL
);

-- Tabla de habilidades
CREATE TABLE skills (
    id bigint primary key generated always as identity,
    name text NOT NULL UNIQUE
);

-- Tabla de sub-habilidades
CREATE TABLE sub_skills (
    id bigint primary key generated always as identity,
    skill_id bigint NOT NULL REFERENCES skills(id),
    name text NOT NULL
);

-- Tabla de pasos
CREATE TABLE steps (
    id bigint primary key generated always as identity,
    sub_skill_id bigint NOT NULL REFERENCES sub_skills(id),
    description text NOT NULL,
    has_timer boolean NOT NULL,
    requires_validation boolean NOT NULL
);

-- Tabla intermedia para diarios y actividades de habilidades
CREATE TABLE diary_skill_activities (
    diary_id bigint NOT NULL REFERENCES diaries(id),
    sub_skill_id bigint NOT NULL REFERENCES sub_skills(id),
    status text CHECK (status IN ('realizado', 'incompleto')) NOT NULL,
    effective boolean,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    PRIMARY KEY (diary_id, sub_skill_id)
);

-- Tabla de tipos de EMA
CREATE TABLE ema_types (
    id bigint primary key generated always as identity,
    name text NOT NULL UNIQUE,
    evaluation_type text CHECK (evaluation_type IN ('rating', 'boolean')) NOT NULL
);

-- Tabla de registros EMA
CREATE TABLE ema_logs (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES users(id),
    ema_type_id bigint NOT NULL REFERENCES ema_types(id),
    rating integer CHECK (rating >= 0 AND rating <= 10),
    boolean_value boolean,
    log_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Tabla de citas diarias
CREATE TABLE daily_quotes (
    id bigint primary key generated always as identity,
    quote text NOT NULL,
    day integer CHECK (day >= 1 AND day <= 365) NOT NULL
);