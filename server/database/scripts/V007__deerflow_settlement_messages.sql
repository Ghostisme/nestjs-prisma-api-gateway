-- ============================================================
-- Lumax Service - DeerFlow usage settlement & message persistence
-- Purpose:
--   1. Add run-level idempotent settlement fields to token consumption.
--   2. Add a per-run conversation message detail table.
--   3. Align conversation status constraint with application status values.
-- ============================================================

ALTER TABLE lumax_token_consumption
  ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS run_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inference_mode VARCHAR(50) DEFAULT 'online';

COMMENT ON COLUMN lumax_token_consumption.thread_id IS 'DeerFlow conversation thread id';
COMMENT ON COLUMN lumax_token_consumption.run_id IS 'DeerFlow single agent run id';
COMMENT ON COLUMN lumax_token_consumption.idempotency_key IS 'Run-level settlement idempotency key to prevent double billing';
COMMENT ON COLUMN lumax_token_consumption.cache_read_tokens IS 'Cache-read tokens returned by the model provider';
COMMENT ON COLUMN lumax_token_consumption.cache_write_tokens IS 'Cache-write / cache-creation tokens returned by the model provider';
COMMENT ON COLUMN lumax_token_consumption.reasoning_tokens IS 'Reasoning/thinking tokens returned by reasoning models';
COMMENT ON COLUMN lumax_token_consumption.inference_mode IS 'Inference mode, e.g. online or offline';

CREATE UNIQUE INDEX IF NOT EXISTS uq_token_consumption_idempotency_key
  ON lumax_token_consumption(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tc_thread_id ON lumax_token_consumption(thread_id);
CREATE INDEX IF NOT EXISTS idx_tc_run_id ON lumax_token_consumption(run_id);

CREATE TABLE IF NOT EXISTS lumax_conversation_message (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  conversation_id INTEGER REFERENCES lumax_conversation(id),
  thread_id VARCHAR(255) NOT NULL,
  run_id VARCHAR(255),
  idempotency_key VARCHAR(255),
  user_id INTEGER NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE lumax_conversation_message IS 'Per-run conversation messages persisted at DeerFlow settlement time';
COMMENT ON COLUMN lumax_conversation_message.id IS 'Primary key id';
COMMENT ON COLUMN lumax_conversation_message.tenant_id IS 'Tenant id';
COMMENT ON COLUMN lumax_conversation_message.conversation_id IS 'Related Lumax conversation id';
COMMENT ON COLUMN lumax_conversation_message.thread_id IS 'DeerFlow conversation thread id';
COMMENT ON COLUMN lumax_conversation_message.run_id IS 'DeerFlow single agent run id';
COMMENT ON COLUMN lumax_conversation_message.idempotency_key IS 'Settlement idempotency key that wrote this message';
COMMENT ON COLUMN lumax_conversation_message.user_id IS 'User id';
COMMENT ON COLUMN lumax_conversation_message.message_id IS 'Message id, from DeerFlow or generated from thread/run/index';
COMMENT ON COLUMN lumax_conversation_message.role IS 'Message role, e.g. user or assistant';
COMMENT ON COLUMN lumax_conversation_message.content IS 'Message content';
COMMENT ON COLUMN lumax_conversation_message.message_index IS 'Message order within the current DeerFlow run';
COMMENT ON COLUMN lumax_conversation_message.created_at IS 'Message creation time';

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_message_tenant_user_message
  ON lumax_conversation_message(tenant_id, user_id, message_id);

CREATE INDEX IF NOT EXISTS idx_lcm_tenant_id ON lumax_conversation_message(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lcm_user_id ON lumax_conversation_message(user_id);
CREATE INDEX IF NOT EXISTS idx_lcm_thread_id ON lumax_conversation_message(thread_id);
CREATE INDEX IF NOT EXISTS idx_lcm_run_id ON lumax_conversation_message(run_id);
CREATE INDEX IF NOT EXISTS idx_lcm_conversation_id ON lumax_conversation_message(conversation_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_conv_status'
      AND conrelid = 'lumax_conversation'::regclass
  ) THEN
    ALTER TABLE lumax_conversation DROP CONSTRAINT chk_conv_status;
  END IF;

  ALTER TABLE lumax_conversation
    ADD CONSTRAINT chk_conv_status
    CHECK (status IN ('ongoing', 'completed', 'ended', 'error', 'failed', 'cancelled'));
END$$;
