-- ============================================================
-- Lumax Service - 补建缺失表 & 缺失字段
-- 用途: 将 Prisma schema 中新增的表和字段同步到数据库
-- 依赖: V001__init_lumax_tables.sql, V004__create_llm_model_table.sql
-- 执行顺序: 第 5 个
-- 说明:
--   1. 为 lumax_conversation / lumax_token_consumption / lumax_user_ext 补充缺失列
--   2. 新建 lumax_api_key / lumax_agent_run / lumax_plan_config /
--      lumax_subscription / lumax_usage_daily_stats /
--      lumax_usage_monthly_stats / lumax_quota_alert 7 张表
-- ============================================================

-- ==========================================================
-- Part 1: 为已有表补充缺失字段
-- ==========================================================

-- lumax_conversation 补充 skill_name
ALTER TABLE lumax_conversation ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100) DEFAULT '';
COMMENT ON COLUMN lumax_conversation.skill_name IS '技能名称';

-- lumax_token_consumption 补充 skill_name / tool_calls_count
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100) DEFAULT '';
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS tool_calls_count INTEGER DEFAULT 0;
COMMENT ON COLUMN lumax_token_consumption.skill_name IS '技能名称';
COMMENT ON COLUMN lumax_token_consumption.tool_calls_count IS '工具调用次数';

-- lumax_token_consumption 补充 model_name 索引（Prisma schema 中有，V001 中缺失）
CREATE INDEX IF NOT EXISTS idx_tc_model_name ON lumax_token_consumption(model_name);

-- lumax_user_ext 补充 default_org_id
ALTER TABLE lumax_user_ext ADD COLUMN IF NOT EXISTS default_org_id INTEGER;
COMMENT ON COLUMN lumax_user_ext.default_org_id IS '默认组织ID（关联 Java 侧组织）';

-- ==========================================================
-- Part 2: 新建缺失表
-- ==========================================================

-- ---------- API Key 管理表 ----------
CREATE TABLE IF NOT EXISTS lumax_api_key (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(100) NOT NULL,
  scopes JSONB DEFAULT '[]',
  rate_limit INTEGER DEFAULT -1,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_api_key IS 'API Key 管理表';
COMMENT ON COLUMN lumax_api_key.id IS '主键ID';
COMMENT ON COLUMN lumax_api_key.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_api_key.user_id IS '用户ID';
COMMENT ON COLUMN lumax_api_key.name IS 'Key 名称';
COMMENT ON COLUMN lumax_api_key.key_hash IS 'Key 哈希值（bcrypt）';
COMMENT ON COLUMN lumax_api_key.key_prefix IS 'Key 前缀（用于展示）';
COMMENT ON COLUMN lumax_api_key.scopes IS '作用域（JSON 数组）';
COMMENT ON COLUMN lumax_api_key.rate_limit IS '速率限制（每分钟请求数，-1 不限制）';
COMMENT ON COLUMN lumax_api_key.expires_at IS '过期时间';
COMMENT ON COLUMN lumax_api_key.last_used_at IS '最后使用时间';
COMMENT ON COLUMN lumax_api_key.status IS '状态（active/revoked）';
COMMENT ON COLUMN lumax_api_key.created_at IS '创建时间';
COMMENT ON COLUMN lumax_api_key.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_ak_tenant_id ON lumax_api_key(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ak_user_id ON lumax_api_key(user_id);
CREATE INDEX IF NOT EXISTS idx_ak_key_prefix ON lumax_api_key(key_prefix);
CREATE INDEX IF NOT EXISTS idx_ak_status ON lumax_api_key(status);

-- ---------- Agent 执行记录表 ----------
CREATE TABLE IF NOT EXISTS lumax_agent_run (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  thread_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) DEFAULT '',
  skill_name VARCHAR(100) DEFAULT '',
  status VARCHAR(20) DEFAULT 'running',
  duration_ms INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  tool_calls_count INTEGER DEFAULT 0,
  error_type VARCHAR(100),
  error_message TEXT,
  model_name VARCHAR(100) DEFAULT '',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_agent_run IS 'Agent 执行记录表';
COMMENT ON COLUMN lumax_agent_run.id IS '主键ID';
COMMENT ON COLUMN lumax_agent_run.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_agent_run.user_id IS '用户ID';
COMMENT ON COLUMN lumax_agent_run.thread_id IS '会话线程ID';
COMMENT ON COLUMN lumax_agent_run.agent_name IS '智能体名称';
COMMENT ON COLUMN lumax_agent_run.skill_name IS '技能名称';
COMMENT ON COLUMN lumax_agent_run.status IS '执行状态（running/completed/failed/cancelled）';
COMMENT ON COLUMN lumax_agent_run.duration_ms IS '执行时长（毫秒）';
COMMENT ON COLUMN lumax_agent_run.tokens_total IS '总 Token 消耗';
COMMENT ON COLUMN lumax_agent_run.tokens_in IS '输入 Token';
COMMENT ON COLUMN lumax_agent_run.tokens_out IS '输出 Token';
COMMENT ON COLUMN lumax_agent_run.tool_calls_count IS '工具调用次数';
COMMENT ON COLUMN lumax_agent_run.error_type IS '错误类型';
COMMENT ON COLUMN lumax_agent_run.error_message IS '错误信息';
COMMENT ON COLUMN lumax_agent_run.model_name IS '模型名称';
COMMENT ON COLUMN lumax_agent_run.started_at IS '开始时间';
COMMENT ON COLUMN lumax_agent_run.ended_at IS '结束时间';
COMMENT ON COLUMN lumax_agent_run.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_ar_tenant_id ON lumax_agent_run(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ar_user_id ON lumax_agent_run(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_thread_id ON lumax_agent_run(thread_id);
CREATE INDEX IF NOT EXISTS idx_ar_status ON lumax_agent_run(status);
CREATE INDEX IF NOT EXISTS idx_ar_started_at ON lumax_agent_run(started_at);
CREATE INDEX IF NOT EXISTS idx_ar_agent_name ON lumax_agent_run(agent_name);

-- ---------- 套餐定义表 ----------
CREATE TABLE IF NOT EXISTS lumax_plan_config (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT '',
  price_monthly INTEGER DEFAULT 0,
  token_limit_monthly INTEGER DEFAULT -1,
  concurrent_limit INTEGER DEFAULT -1,
  features JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'enabled',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_plan_config IS '套餐定义表';
COMMENT ON COLUMN lumax_plan_config.id IS '主键ID';
COMMENT ON COLUMN lumax_plan_config.tier IS '套餐层级（free/pro/enterprise）';
COMMENT ON COLUMN lumax_plan_config.name IS '套餐名称';
COMMENT ON COLUMN lumax_plan_config.description IS '套餐描述';
COMMENT ON COLUMN lumax_plan_config.price_monthly IS '月价格（分）';
COMMENT ON COLUMN lumax_plan_config.token_limit_monthly IS '月度 Token 上限（-1 不限制）';
COMMENT ON COLUMN lumax_plan_config.concurrent_limit IS '并发数限制（-1 不限制）';
COMMENT ON COLUMN lumax_plan_config.features IS '功能列表（JSON）';
COMMENT ON COLUMN lumax_plan_config.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_plan_config.sort_order IS '排序序号';
COMMENT ON COLUMN lumax_plan_config.created_at IS '创建时间';
COMMENT ON COLUMN lumax_plan_config.updated_at IS '更新时间';

-- ---------- 订阅表 ----------
CREATE TABLE IF NOT EXISTS lumax_subscription (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  plan_tier VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  token_limit_monthly INTEGER DEFAULT -1,
  concurrent_limit INTEGER DEFAULT -1,
  features_override JSONB,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id),
  FOREIGN KEY (plan_tier) REFERENCES lumax_plan_config(tier)
);
COMMENT ON TABLE lumax_subscription IS '订阅表';
COMMENT ON COLUMN lumax_subscription.id IS '主键ID';
COMMENT ON COLUMN lumax_subscription.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_subscription.plan_tier IS '套餐层级';
COMMENT ON COLUMN lumax_subscription.status IS '订阅状态（active/cancelled/expired/trialing）';
COMMENT ON COLUMN lumax_subscription.token_limit_monthly IS '月度 Token 上限（从套餐继承或自定义覆盖）';
COMMENT ON COLUMN lumax_subscription.concurrent_limit IS '并发数限制';
COMMENT ON COLUMN lumax_subscription.features_override IS '自定义功能覆盖（JSON）';
COMMENT ON COLUMN lumax_subscription.period_start IS '周期开始时间';
COMMENT ON COLUMN lumax_subscription.period_end IS '周期结束时间';
COMMENT ON COLUMN lumax_subscription.created_at IS '创建时间';
COMMENT ON COLUMN lumax_subscription.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_sub_status ON lumax_subscription(status);

-- ---------- 日用量统计表 ----------
CREATE TABLE IF NOT EXISTS lumax_usage_daily_stats (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER DEFAULT 0,
  date DATE NOT NULL,
  model_name VARCHAR(100) DEFAULT '',
  tokens_in_total BIGINT DEFAULT 0,
  tokens_out_total BIGINT DEFAULT 0,
  calls_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, date, model_name)
);
COMMENT ON TABLE lumax_usage_daily_stats IS '日用量统计表';
COMMENT ON COLUMN lumax_usage_daily_stats.id IS '主键ID';
COMMENT ON COLUMN lumax_usage_daily_stats.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_usage_daily_stats.user_id IS '用户ID（0 表示租户汇总）';
COMMENT ON COLUMN lumax_usage_daily_stats.date IS '统计日期';
COMMENT ON COLUMN lumax_usage_daily_stats.model_name IS '模型名称（空字符串表示全模型汇总）';
COMMENT ON COLUMN lumax_usage_daily_stats.tokens_in_total IS '输入 Token 总量';
COMMENT ON COLUMN lumax_usage_daily_stats.tokens_out_total IS '输出 Token 总量';
COMMENT ON COLUMN lumax_usage_daily_stats.calls_count IS '调用次数';
COMMENT ON COLUMN lumax_usage_daily_stats.avg_duration_ms IS '平均响应时长（毫秒）';
COMMENT ON COLUMN lumax_usage_daily_stats.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_uds_tenant_date ON lumax_usage_daily_stats(tenant_id, date);

-- ---------- 月用量统计表 ----------
CREATE TABLE IF NOT EXISTS lumax_usage_monthly_stats (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  month DATE NOT NULL,
  total_tokens BIGINT DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  peak_concurrent INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, month)
);
COMMENT ON TABLE lumax_usage_monthly_stats IS '月用量统计表';
COMMENT ON COLUMN lumax_usage_monthly_stats.id IS '主键ID';
COMMENT ON COLUMN lumax_usage_monthly_stats.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_usage_monthly_stats.month IS '统计月份（每月1日）';
COMMENT ON COLUMN lumax_usage_monthly_stats.total_tokens IS '总 Token 消耗';
COMMENT ON COLUMN lumax_usage_monthly_stats.total_calls IS '总调用次数';
COMMENT ON COLUMN lumax_usage_monthly_stats.peak_concurrent IS '峰值并发数';
COMMENT ON COLUMN lumax_usage_monthly_stats.active_users IS '活跃用户数';
COMMENT ON COLUMN lumax_usage_monthly_stats.created_at IS '创建时间';

-- ---------- 配额预警记录表 ----------
CREATE TABLE IF NOT EXISTS lumax_quota_alert (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  threshold_pct INTEGER NOT NULL,
  current_pct INTEGER NOT NULL,
  token_limit BIGINT DEFAULT 0,
  token_used BIGINT DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_quota_alert IS '配额预警记录表';
COMMENT ON COLUMN lumax_quota_alert.id IS '主键ID';
COMMENT ON COLUMN lumax_quota_alert.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_quota_alert.alert_type IS '预警类型（warning_80/exceeded_100）';
COMMENT ON COLUMN lumax_quota_alert.threshold_pct IS '阈值百分比';
COMMENT ON COLUMN lumax_quota_alert.current_pct IS '当前使用百分比';
COMMENT ON COLUMN lumax_quota_alert.token_limit IS '月度 Token 上限';
COMMENT ON COLUMN lumax_quota_alert.token_used IS '当前已使用';
COMMENT ON COLUMN lumax_quota_alert.resolved IS '是否已解决';
COMMENT ON COLUMN lumax_quota_alert.resolved_at IS '解决时间';
COMMENT ON COLUMN lumax_quota_alert.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_qa_tenant_id ON lumax_quota_alert(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qa_resolved ON lumax_quota_alert(resolved);
CREATE INDEX IF NOT EXISTS idx_qa_created_at ON lumax_quota_alert(created_at);

-- ==========================================================
-- Part 3: 插入默认套餐数据
-- ==========================================================

INSERT INTO lumax_plan_config (tier, name, description, token_limit_monthly, concurrent_limit, features, sort_order) VALUES
  ('free',       '免费版', '基础免费套餐',   100000, 1,  '["basic_chat"]', 1),
  ('pro',        '专业版', '专业套餐',       -1,     5,  '["basic_chat","advanced_agent","knowledge_base"]', 2),
  ('enterprise', '企业版', '企业定制套餐',   -1,     -1, '["basic_chat","advanced_agent","knowledge_base","priority_support"]', 3)
ON CONFLICT (tier) DO NOTHING;
