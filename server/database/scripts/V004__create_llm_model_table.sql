-- ============================================================
-- Lumax Service - LLM 模型管理表
-- 用途: 创建 lumax_llm_model 表，独立管理 LLM 模型及其定价信息
-- 依赖: V001__init_lumax_tables.sql
-- 执行顺序: 第 4 个
-- 说明: 替代原 dict_item 中 type_code='model_list' 的静态字典数据
-- ============================================================

CREATE TABLE IF NOT EXISTS lumax_llm_model (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  model_code VARCHAR(100) NOT NULL,
  model_name VARCHAR(200) NOT NULL,
  provider VARCHAR(100) NOT NULL DEFAULT '',
  model_type VARCHAR(50) DEFAULT 'chat',
  max_context_tokens INTEGER DEFAULT 0,
  max_output_tokens INTEGER DEFAULT 0,
  input_price NUMERIC(12, 6) DEFAULT 0,
  output_price NUMERIC(12, 6) DEFAULT 0,
  cache_write_price NUMERIC(12, 6) DEFAULT 0,
  cache_read_price NUMERIC(12, 6) DEFAULT 0,
  price_unit VARCHAR(20) DEFAULT 'per_1k_tokens',
  currency VARCHAR(10) DEFAULT 'CNY',
  status VARCHAR(20) DEFAULT 'enabled',
  sort_order INTEGER DEFAULT 0,
  description VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, model_code)
);
COMMENT ON TABLE lumax_llm_model IS 'LLM模型管理表';
COMMENT ON COLUMN lumax_llm_model.id IS '主键ID';
COMMENT ON COLUMN lumax_llm_model.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_llm_model.model_code IS '模型编码（唯一标识）';
COMMENT ON COLUMN lumax_llm_model.model_name IS '模型显示名称';
COMMENT ON COLUMN lumax_llm_model.provider IS '供应商（deepseek/alibaba/zhipu/minimax等）';
COMMENT ON COLUMN lumax_llm_model.model_type IS '模型类型（chat/completion/embedding/image）';
COMMENT ON COLUMN lumax_llm_model.max_context_tokens IS '最大上下文Token数';
COMMENT ON COLUMN lumax_llm_model.max_output_tokens IS '最大输出Token数';
COMMENT ON COLUMN lumax_llm_model.input_price IS '输入价格（每计价单位）';
COMMENT ON COLUMN lumax_llm_model.output_price IS '输出价格（每计价单位）';
COMMENT ON COLUMN lumax_llm_model.cache_write_price IS '缓存写入价格';
COMMENT ON COLUMN lumax_llm_model.cache_read_price IS '缓存读取价格';
COMMENT ON COLUMN lumax_llm_model.price_unit IS '计价单位（per_1k_tokens/per_1m_tokens）';
COMMENT ON COLUMN lumax_llm_model.currency IS '货币（CNY/USD）';
COMMENT ON COLUMN lumax_llm_model.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_llm_model.sort_order IS '排序序号';
COMMENT ON COLUMN lumax_llm_model.description IS '模型描述';
COMMENT ON COLUMN lumax_llm_model.created_at IS '创建时间';
COMMENT ON COLUMN lumax_llm_model.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_lm_tenant_id ON lumax_llm_model(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lm_provider ON lumax_llm_model(provider);
CREATE INDEX IF NOT EXISTS idx_lm_status ON lumax_llm_model(status);
CREATE INDEX IF NOT EXISTS idx_lm_model_type ON lumax_llm_model(model_type);

-- 删除原字典中的 model_list 数据（迁移至 lumax_llm_model 表）
DELETE FROM lumax_dict_item WHERE type_code = 'model_list';
DELETE FROM lumax_dict_type WHERE type_code = 'model_list';

-- 插入初始 LLM 模型数据
INSERT INTO lumax_llm_model (tenant_id, model_code, model_name, provider, model_type, max_context_tokens, max_output_tokens, input_price, output_price, cache_write_price, cache_read_price, price_unit, currency, sort_order, description) VALUES
  (1, 'deepseek-v3', 'DeepSeek-V3', 'deepseek', 'chat', 65536, 8192, 0.001000, 0.002000, 0.000250, 0.000250, 'per_1k_tokens', 'CNY', 1, 'DeepSeek 第三代大语言模型'),
  (1, 'deepseek-r1', 'DeepSeek-R1', 'deepseek', 'chat', 65536, 8192, 0.004000, 0.016000, 0.001000, 0.001000, 'per_1k_tokens', 'CNY', 2, 'DeepSeek 推理模型'),
  (1, 'qwen-max', '通义千问-Max', 'alibaba', 'chat', 32768, 8192, 0.002000, 0.006000, 0.000500, 0.000500, 'per_1k_tokens', 'CNY', 3, '阿里云通义千问旗舰模型'),
  (1, 'qwen-plus', '通义千问-Plus', 'alibaba', 'chat', 131072, 8192, 0.000800, 0.002000, 0.000200, 0.000200, 'per_1k_tokens', 'CNY', 4, '阿里云通义千问增强模型'),
  (1, 'qwen-turbo', '通义千问-Turbo', 'alibaba', 'chat', 131072, 8192, 0.000300, 0.000600, 0.000075, 0.000075, 'per_1k_tokens', 'CNY', 5, '阿里云通义千问高速模型'),
  (1, 'glm-4-plus', 'GLM-4-Plus', 'zhipu', 'chat', 128000, 4096, 0.050000, 0.050000, 0.012500, 0.012500, 'per_1k_tokens', 'CNY', 6, '智谱 GLM-4 增强版'),
  (1, 'glm-4-flash', 'GLM-4-Flash', 'zhipu', 'chat', 128000, 4096, 0.000000, 0.000000, 0.000000, 0.000000, 'per_1k_tokens', 'CNY', 7, '智谱 GLM-4 免费版'),
  (1, 'minimax-text-01', 'Minimax-Text-01', 'minimax', 'chat', 1000000, 16384, 0.001000, 0.008000, 0.000100, 0.000100, 'per_1k_tokens', 'CNY', 8, 'Minimax 长上下文文本模型'),
  (1, 'bailian-v2', '百炼-V2', 'alibaba', 'chat', 32768, 4096, 0.001200, 0.003000, 0.000300, 0.000300, 'per_1k_tokens', 'CNY', 9, '阿里百炼平台通用模型')
ON CONFLICT (tenant_id, model_code) DO NOTHING;
