-- ============================================================
-- Lumax Service - DeerFlow 用量结算与消息持久化
-- 用途：
--   1. 为 Token 消耗表增加运行级幂等结算字段。
--   2. 新增按运行保存的对话消息明细表。
--   3. 对齐对话状态约束与应用层状态值。
-- ============================================================

ALTER TABLE lumax_token_consumption
  ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS run_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inference_mode VARCHAR(50) DEFAULT 'online';

COMMENT ON COLUMN lumax_token_consumption.thread_id IS 'DeerFlow 对话线程 ID';
COMMENT ON COLUMN lumax_token_consumption.run_id IS 'DeerFlow 单次 Agent 执行 ID';
COMMENT ON COLUMN lumax_token_consumption.idempotency_key IS '运行级用量结算幂等键，用于防止重复扣费';
COMMENT ON COLUMN lumax_token_consumption.cache_read_tokens IS '模型供应商返回的缓存读取 Token 数';
COMMENT ON COLUMN lumax_token_consumption.cache_write_tokens IS '模型供应商返回的缓存写入或缓存创建 Token 数';
COMMENT ON COLUMN lumax_token_consumption.reasoning_tokens IS '推理模型返回的思考/推理 Token 数';
COMMENT ON COLUMN lumax_token_consumption.inference_mode IS '推理模式，例如 online 或 offline';

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

COMMENT ON TABLE lumax_conversation_message IS 'DeerFlow 运行结算时持久化的对话消息明细表';
COMMENT ON COLUMN lumax_conversation_message.id IS '主键 ID';
COMMENT ON COLUMN lumax_conversation_message.tenant_id IS '租户 ID';
COMMENT ON COLUMN lumax_conversation_message.conversation_id IS '关联的 Lumax 对话 ID';
COMMENT ON COLUMN lumax_conversation_message.thread_id IS 'DeerFlow 对话线程 ID';
COMMENT ON COLUMN lumax_conversation_message.run_id IS 'DeerFlow 单次 Agent 执行 ID';
COMMENT ON COLUMN lumax_conversation_message.idempotency_key IS '写入该消息的结算幂等键';
COMMENT ON COLUMN lumax_conversation_message.user_id IS '用户 ID';
COMMENT ON COLUMN lumax_conversation_message.message_id IS '消息 ID，来自 DeerFlow 或由线程/运行/序号生成';
COMMENT ON COLUMN lumax_conversation_message.role IS '消息角色，例如 user 或 assistant';
COMMENT ON COLUMN lumax_conversation_message.content IS '消息内容';
COMMENT ON COLUMN lumax_conversation_message.message_index IS '消息在当前 DeerFlow 运行中的顺序';
COMMENT ON COLUMN lumax_conversation_message.created_at IS '消息创建时间';

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