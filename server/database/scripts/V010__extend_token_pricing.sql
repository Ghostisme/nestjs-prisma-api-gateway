-- ============================================================
-- Lumax Service - Token 定价体系扩展
-- 用途: 支持火山方舟/豆包系列分段定价模型，补全 token 消耗缺失字段
-- 依赖: V004__create_llm_model_table.sql, V005__add_missing_tables_and_columns.sql
-- 执行顺序: 第 7 个
-- 背景:
--   火山方舟/豆包模型采用分段定价：同一模型在不同输入长度区间有不同价格
--   如 doubao-seed-2.0-pro:
--     输入 [0,32k]   → 3.2 元/百万token
--     输入 (32,128k]  → 4.8 元/百万token
--     输入 (128,256k] → 9.6 元/百万token
--   部分模型同时按输出长度分段，还区分常规/低延迟/批量推理模式
--   当前 lumax_llm_model 的单一 input_price/output_price 无法表达此结构
-- ============================================================

-- ==========================================================
-- Part 1: 新增 lumax_llm_model_price_tier 分段定价表
-- ==========================================================

CREATE TABLE IF NOT EXISTS lumax_llm_model_price_tier (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL,
  inference_mode VARCHAR(30) DEFAULT 'online',
  input_length_min INTEGER DEFAULT 0,
  input_length_max INTEGER DEFAULT -1,
  output_length_min INTEGER DEFAULT 0,
  output_length_max INTEGER DEFAULT -1,
  input_price NUMERIC(12, 6) DEFAULT 0,
  output_price NUMERIC(12, 6) DEFAULT 0,
  cache_storage_price NUMERIC(12, 6) DEFAULT 0,
  cache_read_price NUMERIC(12, 6) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (model_id) REFERENCES lumax_llm_model(id) ON DELETE CASCADE
);
COMMENT ON TABLE lumax_llm_model_price_tier IS '模型分段定价表';
COMMENT ON COLUMN lumax_llm_model_price_tier.id IS '主键ID';
COMMENT ON COLUMN lumax_llm_model_price_tier.model_id IS '关联模型ID';
COMMENT ON COLUMN lumax_llm_model_price_tier.inference_mode IS '推理模式（online/online_low_latency/batch）';
COMMENT ON COLUMN lumax_llm_model_price_tier.input_length_min IS '输入长度下限（千token），含';
COMMENT ON COLUMN lumax_llm_model_price_tier.input_length_max IS '输入长度上限（千token），含，-1表示无上限';
COMMENT ON COLUMN lumax_llm_model_price_tier.output_length_min IS '输出长度下限（千token），含，0表示不按输出分段';
COMMENT ON COLUMN lumax_llm_model_price_tier.output_length_max IS '输出长度上限（千token），含，-1表示无上限';
COMMENT ON COLUMN lumax_llm_model_price_tier.input_price IS '输入价格（元/百万token）';
COMMENT ON COLUMN lumax_llm_model_price_tier.output_price IS '输出价格（元/百万token）';
COMMENT ON COLUMN lumax_llm_model_price_tier.cache_storage_price IS '缓存存储价格（元/百万token/小时）';
COMMENT ON COLUMN lumax_llm_model_price_tier.cache_read_price IS '缓存输入价格（元/百万token）';
COMMENT ON COLUMN lumax_llm_model_price_tier.sort_order IS '排序序号';
COMMENT ON COLUMN lumax_llm_model_price_tier.created_at IS '创建时间';
COMMENT ON COLUMN lumax_llm_model_price_tier.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_mpt_model_id ON lumax_llm_model_price_tier(model_id);
CREATE INDEX IF NOT EXISTS idx_mpt_inference_mode ON lumax_llm_model_price_tier(inference_mode);

-- ==========================================================
-- Part 2: 扩展 lumax_llm_model 表 — 新增字段
-- ==========================================================

ALTER TABLE lumax_llm_model ADD COLUMN IF NOT EXISTS has_tiered_pricing BOOLEAN DEFAULT FALSE;
ALTER TABLE lumax_llm_model ADD COLUMN IF NOT EXISTS supported_inference_modes VARCHAR(200) DEFAULT 'online';
ALTER TABLE lumax_llm_model ADD COLUMN IF NOT EXISTS cache_storage_price NUMERIC(12, 6) DEFAULT 0;

COMMENT ON COLUMN lumax_llm_model.has_tiered_pricing IS '是否启用分段定价（true 时从 price_tier 子表读取价格）';
COMMENT ON COLUMN lumax_llm_model.supported_inference_modes IS '支持的推理模式（逗号分隔：online,online_low_latency,batch）';
COMMENT ON COLUMN lumax_llm_model.cache_storage_price IS '缓存存储价格（元/百万token/小时），flat模式用';

-- ==========================================================
-- Part 3: 扩展 lumax_token_consumption 表 — 补全缺失 token 字段
-- ==========================================================

ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS input_cost NUMERIC(12, 6) DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS output_cost NUMERIC(12, 6) DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS cache_cost NUMERIC(12, 6) DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 6) DEFAULT 0;
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS inference_mode VARCHAR(30) DEFAULT 'online';
ALTER TABLE lumax_token_consumption ADD COLUMN IF NOT EXISTS price_tier_id INTEGER;

COMMENT ON COLUMN lumax_token_consumption.cache_read_tokens IS '缓存命中Token数（已缓存的输入，价格更低）';
COMMENT ON COLUMN lumax_token_consumption.cache_write_tokens IS '缓存写入Token数（新写入缓存的输入）';
COMMENT ON COLUMN lumax_token_consumption.reasoning_tokens IS '推理Token数（R1类模型的思考token）';
COMMENT ON COLUMN lumax_token_consumption.input_cost IS '输入费用（元）';
COMMENT ON COLUMN lumax_token_consumption.output_cost IS '输出费用（元）';
COMMENT ON COLUMN lumax_token_consumption.cache_cost IS '缓存费用（元，含缓存读取+缓存存储）';
COMMENT ON COLUMN lumax_token_consumption.total_cost IS '总费用（元）';
COMMENT ON COLUMN lumax_token_consumption.inference_mode IS '推理模式（online/online_low_latency/batch）';
COMMENT ON COLUMN lumax_token_consumption.price_tier_id IS '命中的价格分段ID（关联 price_tier 表）';

-- ==========================================================
-- Part 4: 扩展 lumax_conversation 表 — 补全汇总字段
-- ==========================================================

ALTER TABLE lumax_conversation ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_conversation ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_conversation ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 6) DEFAULT 0;

COMMENT ON COLUMN lumax_conversation.cache_read_tokens IS '缓存命中Token数';
COMMENT ON COLUMN lumax_conversation.reasoning_tokens IS '推理Token数';
COMMENT ON COLUMN lumax_conversation.total_cost IS '对话总费用（元）';

-- ==========================================================
-- Part 5: 扩展 lumax_usage_daily_stats — 补全缓存/推理/费用统计
-- ==========================================================

ALTER TABLE lumax_usage_daily_stats ADD COLUMN IF NOT EXISTS cache_read_total BIGINT DEFAULT 0;
ALTER TABLE lumax_usage_daily_stats ADD COLUMN IF NOT EXISTS reasoning_total BIGINT DEFAULT 0;
ALTER TABLE lumax_usage_daily_stats ADD COLUMN IF NOT EXISTS cost_total NUMERIC(14, 4) DEFAULT 0;

COMMENT ON COLUMN lumax_usage_daily_stats.cache_read_total IS '缓存命中Token总量';
COMMENT ON COLUMN lumax_usage_daily_stats.reasoning_total IS '推理Token总量';
COMMENT ON COLUMN lumax_usage_daily_stats.cost_total IS '费用总计（元）';

-- ==========================================================
-- Part 6: 扩展 lumax_agent_run — 补全缓存/推理 token
-- ==========================================================

ALTER TABLE lumax_agent_run ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0;
ALTER TABLE lumax_agent_run ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0;

COMMENT ON COLUMN lumax_agent_run.cache_read_tokens IS '缓存命中Token数';
COMMENT ON COLUMN lumax_agent_run.reasoning_tokens IS '推理Token数';

-- ==========================================================
-- Part 7: 插入豆包系列模型 + 分段定价种子数据
-- ==========================================================

-- 先插入豆包系列模型（如已存在则跳过）
INSERT INTO lumax_llm_model (tenant_id, model_code, model_name, provider, model_type, max_context_tokens, max_output_tokens, input_price, output_price, cache_write_price, cache_read_price, price_unit, currency, sort_order, description, has_tiered_pricing, supported_inference_modes) VALUES
  (1, 'doubao-seed-2.0-pro',   '豆包-Seed-2.0-Pro',   'volcengine', 'chat', 256000, 16384, 3.200000, 16.000000, 0, 0.640000, 'per_1m_tokens', 'CNY', 10, '豆包第二代旗舰模型', TRUE, 'online,online_low_latency,batch'),
  (1, 'doubao-seed-2.0-lite',  '豆包-Seed-2.0-Lite',  'volcengine', 'chat', 256000, 16384, 0.600000, 3.600000,  0, 0.120000, 'per_1m_tokens', 'CNY', 11, '豆包第二代轻量模型', TRUE, 'online,online_low_latency,batch'),
  (1, 'doubao-seed-2.0-mini',  '豆包-Seed-2.0-Mini',  'volcengine', 'chat', 256000, 16384, 0.200000, 2.000000,  0, 0.040000, 'per_1m_tokens', 'CNY', 12, '豆包第二代迷你模型', TRUE, 'online,batch'),
  (1, 'doubao-seed-2.0-code',  '豆包-Seed-2.0-Code',  'volcengine', 'chat', 256000, 16384, 3.200000, 16.000000, 0, 0.640000, 'per_1m_tokens', 'CNY', 13, '豆包第二代代码模型', TRUE, 'online,batch'),
  (1, 'doubao-seed-1.8',       '豆包-Seed-1.8',       'volcengine', 'chat', 256000, 16384, 0.800000, 2.000000,  0, 0.160000, 'per_1m_tokens', 'CNY', 14, '豆包1.8模型', TRUE, 'online,batch'),
  (1, 'doubao-seed-1.6',       '豆包-Seed-1.6',       'volcengine', 'chat', 256000, 16384, 0.800000, 2.000000,  0, 0.160000, 'per_1m_tokens', 'CNY', 15, '豆包1.6模型', TRUE, 'online,batch'),
  (1, 'doubao-seed-1.6-lite',  '豆包-Seed-1.6-Lite',  'volcengine', 'chat', 256000, 16384, 0.300000, 0.600000,  0, 0.060000, 'per_1m_tokens', 'CNY', 16, '豆包1.6轻量模型', TRUE, 'online,batch'),
  (1, 'doubao-seed-1.6-flash', '豆包-Seed-1.6-Flash', 'volcengine', 'chat', 256000, 16384, 0.150000, 1.500000,  0, 0.030000, 'per_1m_tokens', 'CNY', 17, '豆包1.6快速模型', TRUE, 'online,batch'),
  (1, 'doubao-1.5-pro-32k',    '豆包-1.5-Pro-32K',    'volcengine', 'chat', 32000,  8192,  0.800000, 2.000000,  0, 0.160000, 'per_1m_tokens', 'CNY', 18, '豆包1.5专业版32K', FALSE, 'online,batch'),
  (1, 'doubao-1.5-lite-32k',   '豆包-1.5-Lite-32K',   'volcengine', 'chat', 32000,  8192,  0.300000, 0.600000,  0, 0.060000, 'per_1m_tokens', 'CNY', 19, '豆包1.5轻量版32K', FALSE, 'online,batch'),
  (1, 'deepseek-v3.2',         'DeepSeek-V3.2',       'volcengine', 'chat', 128000, 8192,  2.000000, 3.000000,  0, 0.400000, 'per_1m_tokens', 'CNY', 20, 'DeepSeek V3.2（火山方舟）', TRUE, 'online,batch'),
  (1, 'deepseek-v3.1',         'DeepSeek-V3.1',       'volcengine', 'chat', 128000, 8192,  4.000000, 12.000000, 0, 0.800000, 'per_1m_tokens', 'CNY', 21, 'DeepSeek V3.1（火山方舟）', FALSE, 'online,batch'),
  (1, 'deepseek-r1',           'DeepSeek-R1',         'volcengine', 'chat', 128000, 8192,  4.000000, 16.000000, 0, 0.800000, 'per_1m_tokens', 'CNY', 22, 'DeepSeek R1 推理模型（火山方舟）', FALSE, 'online,batch')
ON CONFLICT (tenant_id, model_code) DO UPDATE SET
  has_tiered_pricing = EXCLUDED.has_tiered_pricing,
  supported_inference_modes = EXCLUDED.supported_inference_modes,
  input_price = EXCLUDED.input_price,
  output_price = EXCLUDED.output_price,
  cache_read_price = EXCLUDED.cache_read_price,
  price_unit = EXCLUDED.price_unit;

-- 插入分段定价数据 (doubao-seed-2.0-pro 在线推理-常规)
INSERT INTO lumax_llm_model_price_tier (model_id, inference_mode, input_length_min, input_length_max, output_length_min, output_length_max, input_price, output_price, cache_storage_price, cache_read_price, sort_order) VALUES
  -- doubao-seed-2.0-pro: 常规在线
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online', 0, 32, 0, -1, 3.200000, 16.000000, 0.017000, 0.640000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online', 32, 128, 0, -1, 4.800000, 24.000000, 0.017000, 0.960000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online', 128, 256, 0, -1, 9.600000, 48.000000, 0.017000, 1.920000, 3),
  -- doubao-seed-2.0-pro: 低延迟
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online_low_latency', 0, 32, 0, -1, 9.600000, 48.000000, 0, 1.920000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online_low_latency', 32, 128, 0, -1, 14.400000, 72.000000, 0, 2.880000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'online_low_latency', 128, 256, 0, -1, 28.800000, 144.000000, 0, 5.760000, 3),
  -- doubao-seed-2.0-pro: 批量推理
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'batch', 0, 32, 0, -1, 1.600000, 8.000000, 0, 0.640000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'batch', 32, 128, 0, -1, 2.400000, 12.000000, 0, 0.960000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-pro' AND tenant_id=1), 'batch', 128, 256, 0, -1, 4.800000, 24.000000, 0, 1.920000, 3),

  -- doubao-seed-2.0-lite: 常规在线
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online', 0, 32, 0, -1, 0.600000, 3.600000, 0.017000, 0.120000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online', 32, 128, 0, -1, 0.900000, 5.400000, 0.017000, 0.180000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online', 128, 256, 0, -1, 1.800000, 10.800000, 0.017000, 0.360000, 3),
  -- doubao-seed-2.0-lite: 低延迟
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online_low_latency', 0, 32, 0, -1, 1.200000, 7.200000, 0, 0.240000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online_low_latency', 32, 128, 0, -1, 1.800000, 10.800000, 0, 0.360000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'online_low_latency', 128, 256, 0, -1, 3.600000, 21.600000, 0, 0.720000, 3),
  -- doubao-seed-2.0-lite: 批量推理
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'batch', 0, 32, 0, -1, 0.300000, 1.800000, 0, 0.120000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'batch', 32, 128, 0, -1, 0.450000, 2.700000, 0, 0.180000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-lite' AND tenant_id=1), 'batch', 128, 256, 0, -1, 0.900000, 5.400000, 0, 0.360000, 3),

  -- doubao-seed-2.0-mini: 常规在线
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-mini' AND tenant_id=1), 'online', 0, 32, 0, -1, 0.200000, 2.000000, 0.017000, 0.040000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-mini' AND tenant_id=1), 'online', 32, 128, 0, -1, 0.400000, 4.000000, 0.017000, 0.080000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-2.0-mini' AND tenant_id=1), 'online', 128, 256, 0, -1, 0.800000, 8.000000, 0.017000, 0.160000, 3),

  -- doubao-seed-1.8: 常规在线（含输出长度分段）
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.8' AND tenant_id=1), 'online', 0, 32, 0.000, 0.200, 0.800000, 2.000000, 0.017000, 0.160000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.8' AND tenant_id=1), 'online', 0, 32, 0.200, -1, 0.800000, 8.000000, 0.017000, 0.160000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.8' AND tenant_id=1), 'online', 32, 128, 0, -1, 1.200000, 16.000000, 0.017000, 0.160000, 3),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.8' AND tenant_id=1), 'online', 128, 256, 0, -1, 2.400000, 24.000000, 0.017000, 0.160000, 4),

  -- doubao-seed-1.6: 常规在线（含输出长度分段）
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6' AND tenant_id=1), 'online', 0, 32, 0.000, 0.200, 0.800000, 2.000000, 0.017000, 0.160000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6' AND tenant_id=1), 'online', 0, 32, 0.200, -1, 0.800000, 8.000000, 0.017000, 0.160000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6' AND tenant_id=1), 'online', 32, 128, 0, -1, 1.200000, 16.000000, 0.017000, 0.160000, 3),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6' AND tenant_id=1), 'online', 128, 256, 0, -1, 2.400000, 24.000000, 0.017000, 0.160000, 4),

  -- doubao-seed-1.6-flash: 常规在线
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6-flash' AND tenant_id=1), 'online', 0, 32, 0, -1, 0.150000, 1.500000, 0.017000, 0.030000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6-flash' AND tenant_id=1), 'online', 32, 128, 0, -1, 0.300000, 3.000000, 0.017000, 0.030000, 2),
  ((SELECT id FROM lumax_llm_model WHERE model_code='doubao-seed-1.6-flash' AND tenant_id=1), 'online', 128, 256, 0, -1, 0.600000, 6.000000, 0.017000, 0.030000, 3),

  -- deepseek-v3.2: 常规在线
  ((SELECT id FROM lumax_llm_model WHERE model_code='deepseek-v3.2' AND tenant_id=1), 'online', 0, 32, 0, -1, 2.000000, 3.000000, 0.017000, 0.400000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='deepseek-v3.2' AND tenant_id=1), 'online', 32, 128, 0, -1, 4.000000, 6.000000, 0.017000, 0.400000, 2),
  -- deepseek-v3.2: 批量推理
  ((SELECT id FROM lumax_llm_model WHERE model_code='deepseek-v3.2' AND tenant_id=1), 'batch', 0, 32, 0, -1, 1.000000, 1.500000, 0, 0.400000, 1),
  ((SELECT id FROM lumax_llm_model WHERE model_code='deepseek-v3.2' AND tenant_id=1), 'batch', 32, 128, 0, -1, 2.000000, 3.000000, 0, 0.400000, 2)
ON CONFLICT DO NOTHING;
