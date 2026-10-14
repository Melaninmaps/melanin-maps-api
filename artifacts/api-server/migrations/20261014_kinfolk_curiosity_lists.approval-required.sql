-- APPROVAL REQUIRED — SOURCE ONLY. Do not execute from application startup.
-- Private Curiosity Lists / Things I Want To Learn. No backfill, inference,
-- public sharing, delivery, analytics, or automatic Kinfolk use is authorized.
BEGIN;

CREATE TABLE kinfolk_curiosity_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_name TEXT NOT NULL,
  encryption_key_id VARCHAR(64) NOT NULL,
  allow_kinfolk_use BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_curiosity_lists_name_encrypted_check
    CHECK (name = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_curiosity_lists_id_owner_key UNIQUE (id, user_id)
);
CREATE INDEX kinfolk_curiosity_lists_owner_updated_idx
  ON kinfolk_curiosity_lists (user_id, updated_at);

CREATE TABLE kinfolk_curiosity_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL DEFAULT '[Encrypted private memory]',
  encrypted_item_text TEXT NOT NULL,
  encryption_key_id VARCHAR(64) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kinfolk_curiosity_list_items_owner_list_fk
    FOREIGN KEY (list_id, user_id) REFERENCES kinfolk_curiosity_lists(id, user_id) ON DELETE CASCADE,
  CONSTRAINT kinfolk_curiosity_list_items_list_position_key UNIQUE (list_id, position),
  CONSTRAINT kinfolk_curiosity_list_items_text_encrypted_check
    CHECK (item_text = '[Encrypted private memory]'),
  CONSTRAINT kinfolk_curiosity_list_items_position_check CHECK (position >= 0)
);
CREATE INDEX kinfolk_curiosity_list_items_owner_list_idx
  ON kinfolk_curiosity_list_items (user_id, list_id, position);

COMMIT;
