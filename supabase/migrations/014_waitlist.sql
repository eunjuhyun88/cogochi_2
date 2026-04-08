-- 014: Alpha waitlist email collection
CREATE TABLE IF NOT EXISTS waitlist_emails (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT DEFAULT 'home',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waitlist_email ON waitlist_emails (email);
