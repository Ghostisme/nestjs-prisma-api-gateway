-- ============================================================
-- Lumax Service - 性能优化 & 数据完整性增强
-- 用途: 补充复合索引、CHECK 约束、updated_at 自动更新触发器
-- 依赖: V001 ~ V005
-- 执行顺序: 第 6 个
-- 说明:
--   1. 为高频查询场景补充复合索引
--   2. 添加 CHECK 约束保障枚举字段合法性
--   3. 创建通用 updated_at 自动更新触发器函数并应用到所有含 updated_at 的表
-- ============================================================

-- ==========================================================
-- Part 1: 复合索引 —— 提升常见查询性能
-- ==========================================================

-- lumax_conversation: 租户 + 时间范围查询（仪表盘、导出）
CREATE INDEX IF NOT EXISTS idx_conv_tenant_start
  ON lumax_conversation(tenant_id, start_time DESC);

-- lumax_conversation: 按用户 + 状态筛选
CREATE INDEX IF NOT EXISTS idx_conv_user_status
  ON lumax_conversation(user_id, status);

-- lumax_conversation: 按租户 + 智能体筛选
CREATE INDEX IF NOT EXISTS idx_conv_tenant_agent
  ON lumax_conversation(tenant_id, agent_name);

-- lumax_token_consumption: 租户 + 时间范围汇总
CREATE INDEX IF NOT EXISTS idx_tc_tenant_consumed
  ON lumax_token_consumption(tenant_id, consumed_at DESC);

-- lumax_token_consumption: 按用户 + 模型聚合
CREATE INDEX IF NOT EXISTS idx_tc_user_model
  ON lumax_token_consumption(user_id, model_name);

-- lumax_feedback: 租户 + 反馈结果筛选
CREATE INDEX IF NOT EXISTS idx_fb_tenant_result
  ON lumax_feedback(tenant_id, result);

-- lumax_agent_run: 租户 + 时间范围（Agent 监控列表）
CREATE INDEX IF NOT EXISTS idx_ar_tenant_started
  ON lumax_agent_run(tenant_id, started_at DESC);

-- lumax_agent_run: 按模型 + 状态聚合
CREATE INDEX IF NOT EXISTS idx_ar_model_status
  ON lumax_agent_run(model_name, status);

-- lumax_banned_word_trigger: 租户 + 时间范围（违禁词趋势图）
CREATE INDEX IF NOT EXISTS idx_bwt_tenant_time
  ON lumax_banned_word_trigger(tenant_id, trigger_time DESC);

-- lumax_api_key: 租户 + 状态（Key 管理列表）
CREATE INDEX IF NOT EXISTS idx_ak_tenant_status
  ON lumax_api_key(tenant_id, status);

-- lumax_quota_alert: 租户 + 未解决告警（首页预警提示）
CREATE INDEX IF NOT EXISTS idx_qa_tenant_unresolved
  ON lumax_quota_alert(tenant_id, resolved) WHERE resolved = FALSE;

-- lumax_usage_monthly_stats: 租户索引
CREATE INDEX IF NOT EXISTS idx_ums_tenant_id
  ON lumax_usage_monthly_stats(tenant_id);

-- lumax_knowledge_base_document: 状态筛选（处理中的文档）
CREATE INDEX IF NOT EXISTS idx_kbd_status
  ON lumax_knowledge_base_document(status);

-- lumax_llm_model: 租户 + 状态（可用模型列表）
CREATE INDEX IF NOT EXISTS idx_lm_tenant_status
  ON lumax_llm_model(tenant_id, status);

-- ==========================================================
-- Part 2: CHECK 约束 —— 保障枚举字段合法值
-- ==========================================================

DO $$
BEGIN
  -- lumax_conversation.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_conv_status'
  ) THEN
    ALTER TABLE lumax_conversation
      ADD CONSTRAINT chk_conv_status
      CHECK (status IN ('ongoing', 'completed', 'ended', 'error'));
  END IF;

  -- lumax_conversation.satisfaction
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_conv_satisfaction'
  ) THEN
    ALTER TABLE lumax_conversation
      ADD CONSTRAINT chk_conv_satisfaction
      CHECK (satisfaction IN ('none', 'positive', 'negative'));
  END IF;

  -- lumax_feedback.result
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_fb_result'
  ) THEN
    ALTER TABLE lumax_feedback
      ADD CONSTRAINT chk_fb_result
      CHECK (result IN ('positive', 'negative'));
  END IF;

  -- lumax_banned_word.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_bw_status'
  ) THEN
    ALTER TABLE lumax_banned_word
      ADD CONSTRAINT chk_bw_status
      CHECK (status IN ('enabled', 'disabled'));
  END IF;

  -- lumax_banned_word.trigger_mode
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_bw_trigger_mode'
  ) THEN
    ALTER TABLE lumax_banned_word
      ADD CONSTRAINT chk_bw_trigger_mode
      CHECK (trigger_mode IN ('input', 'output', 'both'));
  END IF;

  -- lumax_banned_word.match_mode
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_bw_match_mode'
  ) THEN
    ALTER TABLE lumax_banned_word
      ADD CONSTRAINT chk_bw_match_mode
      CHECK (match_mode IN ('exact', 'fuzzy', 'semantic', 'model'));
  END IF;

  -- lumax_api_key.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_ak_status'
  ) THEN
    ALTER TABLE lumax_api_key
      ADD CONSTRAINT chk_ak_status
      CHECK (status IN ('active', 'revoked'));
  END IF;

  -- lumax_agent_run.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_ar_status'
  ) THEN
    ALTER TABLE lumax_agent_run
      ADD CONSTRAINT chk_ar_status
      CHECK (status IN ('running', 'completed', 'failed', 'cancelled'));
  END IF;

  -- lumax_plan_config.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pc_status'
  ) THEN
    ALTER TABLE lumax_plan_config
      ADD CONSTRAINT chk_pc_status
      CHECK (status IN ('enabled', 'disabled'));
  END IF;

  -- lumax_subscription.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sub_status'
  ) THEN
    ALTER TABLE lumax_subscription
      ADD CONSTRAINT chk_sub_status
      CHECK (status IN ('active', 'cancelled', 'expired', 'trialing'));
  END IF;

  -- lumax_knowledge_base.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_kb_status'
  ) THEN
    ALTER TABLE lumax_knowledge_base
      ADD CONSTRAINT chk_kb_status
      CHECK (status IN ('enabled', 'disabled'));
  END IF;

  -- lumax_knowledge_base_document.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_kbd_status'
  ) THEN
    ALTER TABLE lumax_knowledge_base_document
      ADD CONSTRAINT chk_kbd_status
      CHECK (status IN ('processing', 'completed', 'failed'));
  END IF;

  -- lumax_llm_model.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_lm_status'
  ) THEN
    ALTER TABLE lumax_llm_model
      ADD CONSTRAINT chk_lm_status
      CHECK (status IN ('enabled', 'disabled'));
  END IF;

  -- lumax_llm_model.model_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_lm_model_type'
  ) THEN
    ALTER TABLE lumax_llm_model
      ADD CONSTRAINT chk_lm_model_type
      CHECK (model_type IN ('chat', 'completion', 'embedding', 'image'));
  END IF;

  -- lumax_banned_word_category.risk_level
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_bwc_risk_level'
  ) THEN
    ALTER TABLE lumax_banned_word_category
      ADD CONSTRAINT chk_bwc_risk_level
      CHECK (risk_level IN ('high', 'medium', 'low'));
  END IF;

  -- lumax_quota_alert.alert_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_qa_alert_type'
  ) THEN
    ALTER TABLE lumax_quota_alert
      ADD CONSTRAINT chk_qa_alert_type
      CHECK (alert_type IN ('warning_80', 'exceeded_100'));
  END IF;
END$$;

-- ==========================================================
-- Part 3: updated_at 自动更新触发器
-- ==========================================================

CREATE OR REPLACE FUNCTION lumax_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'lumax_conversation',
    'lumax_user_quota',
    'lumax_knowledge_base',
    'lumax_partner_enterprise',
    'lumax_dict_type',
    'lumax_dict_item',
    'lumax_user_ext',
    'lumax_api_key',
    'lumax_plan_config',
    'lumax_subscription',
    'lumax_banned_word_category',
    'lumax_llm_model'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION lumax_set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END$$;

-- ==========================================================
-- Part 4: 修正 V003 种子数据状态值不一致
-- ==========================================================

UPDATE lumax_conversation
  SET status = 'completed'
WHERE status = 'ended';
