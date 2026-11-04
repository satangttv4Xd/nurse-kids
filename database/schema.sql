-- Little Steps: My Health Journey — Research database (PostgreSQL 14+)
-- หลักการ: ใช้ Participant ID แทนตัวตนจริง เก็บเท่าที่จำเป็น ไม่เก็บชื่อจริง/เบอร์โทร/เลขบัตร/เสียง/วิดีโอ
-- ไฟล์นี้รันซ้ำได้ (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS participants (
  participant_id  TEXT PRIMARY KEY CHECK (participant_id ~ '^P-[0-9A-F]{8}$'),
  -- ชื่อเล่นที่ใช้แสดงในเกม (ไม่บังคับ) — ผู้ดูแลระบบลบได้ตามนโยบาย
  nickname        TEXT CHECK (char_length(nickname) <= 40),
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_participants_created ON participants (created_at);

CREATE TABLE IF NOT EXISTS consent_records (
  id              BIGSERIAL PRIMARY KEY,
  participant_id  TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  guardian_consent BOOLEAN NOT NULL DEFAULT FALSE,
  child_assent    BOOLEAN NOT NULL DEFAULT FALSE,
  -- เลขเอกสาร/รหัสแบบฟอร์มยินยอม (ห้ามใส่ชื่อจริง)
  form_reference  TEXT CHECK (char_length(form_reference) <= 80),
  note            TEXT CHECK (char_length(note) <= 500),
  recorded_by     BIGINT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_consent_participant ON consent_records (participant_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  session_id      UUID PRIMARY KEY,
  participant_id  TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  last_event_at   TIMESTAMPTZ,
  -- started | in_progress | completed | interrupted  (abandoned คำนวณตอนอ่าน: ไม่มีความเคลื่อนไหว > 30 นาที)
  status          TEXT NOT NULL DEFAULT 'started'
                  CHECK (status IN ('started','in_progress','completed','interrupted')),
  pause_count     INTEGER NOT NULL DEFAULT 0,
  resume_count    INTEGER NOT NULL DEFAULT 0,
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON sessions (participant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions (started_at);

CREATE TABLE IF NOT EXISTS session_settings (
  session_id      UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
  -- independent | guided | supported
  assistance_mode TEXT NOT NULL DEFAULT 'independent' CHECK (assistance_mode IN ('independent','guided','supported')),
  music_on        BOOLEAN NOT NULL DEFAULT TRUE,
  voice_on        BOOLEAN NOT NULL DEFAULT TRUE,
  device_type     TEXT CHECK (device_type IN ('desktop','tablet','phone','unknown')),
  game_version    TEXT CHECK (char_length(game_version) <= 20)
);

-- เหตุการณ์ทุกอย่างในเกม (หนึ่งแถวต่อเหตุการณ์)
CREATE TABLE IF NOT EXISTS mission_events (
  id              BIGSERIAL PRIMARY KEY,
  -- client_event_id ใช้กันการส่งซ้ำจากคิวออฟไลน์
  client_event_id UUID NOT NULL UNIQUE,
  session_id      UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  -- mission_start | answer | hint | pause | resume | exit | step_view | mission_skip
  event_type      TEXT NOT NULL CHECK (event_type IN ('mission_start','answer','hint','pause','resume','exit','step_view','mission_skip')),
  mission_id      TEXT CHECK (mission_id ~ '^M0[1-8]$'),
  choice_id       TEXT CHECK (choice_id IN ('A','B')),
  is_correct      BOOLEAN,
  attempt         INTEGER CHECK (attempt BETWEEN 1 AND 100),
  hint_level      INTEGER CHECK (hint_level BETWEEN 0 AND 10),
  response_ms     INTEGER CHECK (response_ms BETWEEN 0 AND 86400000),
  caregiver_assisted BOOLEAN NOT NULL DEFAULT FALSE,
  step_index      INTEGER,
  occurred_at     TIMESTAMPTZ NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_session ON mission_events (session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_mission ON mission_events (mission_id, event_type);

-- การช่วยเหลือจากผู้ดูแล (แยกจากคำตอบ)
CREATE TABLE IF NOT EXISTS assistance_events (
  id              BIGSERIAL PRIMARY KEY,
  client_event_id UUID NOT NULL UNIQUE,
  session_id      UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  mission_id      TEXT CHECK (mission_id ~ '^M0[1-8]$'),
  -- caregiver_help (ผู้ดูแลช่วยอธิบาย/ชี้ภาพ/ช่วยเลือก)
  assistance_type TEXT NOT NULL CHECK (assistance_type IN ('caregiver_help')),
  occurred_at     TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assist_session ON assistance_events (session_id);

CREATE TABLE IF NOT EXISTS admin_users (
  id              BIGSERIAL PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-zA-Z0-9._-]{3,40}$'),
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','researcher','viewer')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  username        TEXT,
  action          TEXT NOT NULL,
  target          TEXT,
  detail          JSONB,
  ip              TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
