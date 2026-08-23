-- ============================================================
-- Lumax Service - 初始化建表脚本
-- 用途: 创建 lumax_* 全部业务表
-- 数据库: PostgreSQL
-- 执行顺序: 第 1 个
-- ============================================================

-- 对话记录
CREATE TABLE IF NOT EXISTS lumax_conversation (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  thread_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(100) DEFAULT '',
  dept_id INTEGER,
  model_name VARCHAR(100) DEFAULT '',
  agent_name VARCHAR(100) DEFAULT '',
  title VARCHAR(500) DEFAULT '',
  message_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER DEFAULT 0,
  satisfaction VARCHAR(20) DEFAULT 'none',
  status VARCHAR(20) DEFAULT 'ongoing',
  banned_word_hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_conversation IS '对话记录表';
COMMENT ON COLUMN lumax_conversation.id IS '主键ID';
COMMENT ON COLUMN lumax_conversation.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_conversation.thread_id IS '会话线程ID';
COMMENT ON COLUMN lumax_conversation.user_id IS '用户ID';
COMMENT ON COLUMN lumax_conversation.username IS '用户名';
COMMENT ON COLUMN lumax_conversation.dept_id IS '部门ID';
COMMENT ON COLUMN lumax_conversation.model_name IS '模型名称';
COMMENT ON COLUMN lumax_conversation.agent_name IS '智能体名称';
COMMENT ON COLUMN lumax_conversation.title IS '对话标题';
COMMENT ON COLUMN lumax_conversation.message_count IS '消息数量';
COMMENT ON COLUMN lumax_conversation.input_tokens IS '输入Token数';
COMMENT ON COLUMN lumax_conversation.output_tokens IS '输出Token数';
COMMENT ON COLUMN lumax_conversation.total_tokens IS '总Token数';
COMMENT ON COLUMN lumax_conversation.start_time IS '开始时间';
COMMENT ON COLUMN lumax_conversation.end_time IS '结束时间';
COMMENT ON COLUMN lumax_conversation.duration_seconds IS '持续时长（秒）';
COMMENT ON COLUMN lumax_conversation.satisfaction IS '满意度评价';
COMMENT ON COLUMN lumax_conversation.status IS '对话状态';
COMMENT ON COLUMN lumax_conversation.banned_word_hit_count IS '违禁词命中次数';
COMMENT ON COLUMN lumax_conversation.created_at IS '创建时间';
COMMENT ON COLUMN lumax_conversation.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_conv_tenant_id ON lumax_conversation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conv_user_id ON lumax_conversation(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_thread_id ON lumax_conversation(thread_id);
CREATE INDEX IF NOT EXISTS idx_conv_start_time ON lumax_conversation(start_time);
CREATE INDEX IF NOT EXISTS idx_conv_status ON lumax_conversation(status);

-- Token 消耗明细
CREATE TABLE IF NOT EXISTS lumax_token_consumption (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  conversation_id INTEGER REFERENCES lumax_conversation(id),
  user_id INTEGER NOT NULL,
  model_name VARCHAR(100) DEFAULT '',
  agent_name VARCHAR(100) DEFAULT '',
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  consumed_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_token_consumption IS 'Token消耗记录表';
COMMENT ON COLUMN lumax_token_consumption.id IS '主键ID';
COMMENT ON COLUMN lumax_token_consumption.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_token_consumption.conversation_id IS '对话ID';
COMMENT ON COLUMN lumax_token_consumption.user_id IS '用户ID';
COMMENT ON COLUMN lumax_token_consumption.model_name IS '模型名称';
COMMENT ON COLUMN lumax_token_consumption.agent_name IS '智能体名称';
COMMENT ON COLUMN lumax_token_consumption.input_tokens IS '输入Token数';
COMMENT ON COLUMN lumax_token_consumption.output_tokens IS '输出Token数';
COMMENT ON COLUMN lumax_token_consumption.total_tokens IS '总Token数';
COMMENT ON COLUMN lumax_token_consumption.response_time_ms IS '响应耗时（毫秒）';
COMMENT ON COLUMN lumax_token_consumption.consumed_at IS '消耗时间';
CREATE INDEX IF NOT EXISTS idx_tc_tenant_id ON lumax_token_consumption(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tc_user_id ON lumax_token_consumption(user_id);
CREATE INDEX IF NOT EXISTS idx_tc_consumed_at ON lumax_token_consumption(consumed_at);
CREATE INDEX IF NOT EXISTS idx_tc_conv_id ON lumax_token_consumption(conversation_id);

-- 用户配额
CREATE TABLE IF NOT EXISTS lumax_user_quota (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(100) DEFAULT '',
  dept_id INTEGER,
  total_quota INTEGER DEFAULT -1,
  used_quota INTEGER DEFAULT 0,
  quota_period VARCHAR(20) DEFAULT 'unlimited',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);
COMMENT ON TABLE lumax_user_quota IS '用户配额表';
COMMENT ON COLUMN lumax_user_quota.id IS '主键ID';
COMMENT ON COLUMN lumax_user_quota.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_user_quota.user_id IS '用户ID';
COMMENT ON COLUMN lumax_user_quota.username IS '用户名';
COMMENT ON COLUMN lumax_user_quota.dept_id IS '部门ID';
COMMENT ON COLUMN lumax_user_quota.total_quota IS '总配额（-1表示不限制）';
COMMENT ON COLUMN lumax_user_quota.used_quota IS '已使用配额';
COMMENT ON COLUMN lumax_user_quota.quota_period IS '配额周期';
COMMENT ON COLUMN lumax_user_quota.created_at IS '创建时间';
COMMENT ON COLUMN lumax_user_quota.updated_at IS '更新时间';

-- 配额操作记录
CREATE TABLE IF NOT EXISTS lumax_quota_operation (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  operator_id INTEGER NOT NULL,
  operator_name VARCHAR(100) DEFAULT '',
  operation_type VARCHAR(20) NOT NULL,
  original_quota INTEGER NOT NULL,
  actual_quota INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id, user_id) REFERENCES lumax_user_quota(tenant_id, user_id)
);
COMMENT ON TABLE lumax_quota_operation IS '配额操作记录表';
COMMENT ON COLUMN lumax_quota_operation.id IS '主键ID';
COMMENT ON COLUMN lumax_quota_operation.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_quota_operation.user_id IS '用户ID';
COMMENT ON COLUMN lumax_quota_operation.operator_id IS '操作人ID';
COMMENT ON COLUMN lumax_quota_operation.operator_name IS '操作人姓名';
COMMENT ON COLUMN lumax_quota_operation.operation_type IS '操作类型';
COMMENT ON COLUMN lumax_quota_operation.original_quota IS '原始配额';
COMMENT ON COLUMN lumax_quota_operation.actual_quota IS '实际配额';
COMMENT ON COLUMN lumax_quota_operation.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_qo_tenant_id ON lumax_quota_operation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qo_user_id ON lumax_quota_operation(user_id);

-- 用户反馈 (每轮消息粒度)
CREATE TABLE IF NOT EXISTS lumax_feedback (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  conversation_id INTEGER REFERENCES lumax_conversation(id),
  thread_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  run_id VARCHAR(255),
  user_id INTEGER NOT NULL,
  message_index INTEGER DEFAULT 0,
  result VARCHAR(20) NOT NULL,
  user_question TEXT DEFAULT '',
  assistant_answer TEXT DEFAULT '',
  agent_name VARCHAR(100) DEFAULT '',
  comment TEXT,
  feedback_time TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);
COMMENT ON TABLE lumax_feedback IS '用户反馈表';
COMMENT ON COLUMN lumax_feedback.id IS '主键ID';
COMMENT ON COLUMN lumax_feedback.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_feedback.conversation_id IS '对话ID';
COMMENT ON COLUMN lumax_feedback.thread_id IS '会话线程ID';
COMMENT ON COLUMN lumax_feedback.message_id IS '消息ID';
COMMENT ON COLUMN lumax_feedback.run_id IS '运行ID';
COMMENT ON COLUMN lumax_feedback.user_id IS '用户ID';
COMMENT ON COLUMN lumax_feedback.message_index IS '消息序号';
COMMENT ON COLUMN lumax_feedback.result IS '反馈结果（positive/negative）';
COMMENT ON COLUMN lumax_feedback.user_question IS '用户提问内容';
COMMENT ON COLUMN lumax_feedback.assistant_answer IS '助手回答内容';
COMMENT ON COLUMN lumax_feedback.agent_name IS '智能体名称';
COMMENT ON COLUMN lumax_feedback.comment IS '反馈评论';
COMMENT ON COLUMN lumax_feedback.feedback_time IS '反馈时间';
COMMENT ON COLUMN lumax_feedback.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_fb_tenant_id ON lumax_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fb_conv_id ON lumax_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fb_time ON lumax_feedback(feedback_time);

-- 违禁词类型
CREATE TABLE IF NOT EXISTS lumax_banned_word_category (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  risk_level VARCHAR(20) DEFAULT 'medium',
  word_count INTEGER DEFAULT 0,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
COMMENT ON TABLE lumax_banned_word_category IS '违禁词类型表';
COMMENT ON COLUMN lumax_banned_word_category.id IS '主键ID';
COMMENT ON COLUMN lumax_banned_word_category.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_banned_word_category.name IS '类型名称';
COMMENT ON COLUMN lumax_banned_word_category.risk_level IS '风险等级（high/medium/low）';
COMMENT ON COLUMN lumax_banned_word_category.word_count IS '词条数量';
COMMENT ON COLUMN lumax_banned_word_category.trigger_count IS '触发次数';
COMMENT ON COLUMN lumax_banned_word_category.created_at IS '创建时间';
COMMENT ON COLUMN lumax_banned_word_category.updated_at IS '更新时间';

-- 违禁词条目
CREATE TABLE IF NOT EXISTS lumax_banned_word (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL REFERENCES lumax_banned_word_category(id),
  word VARCHAR(50) NOT NULL,
  trigger_mode VARCHAR(50) DEFAULT 'input',
  match_mode VARCHAR(50) DEFAULT 'exact',
  status VARCHAR(20) DEFAULT 'enabled',
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_banned_word IS '违禁词表';
COMMENT ON COLUMN lumax_banned_word.id IS '主键ID';
COMMENT ON COLUMN lumax_banned_word.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_banned_word.category_id IS '违禁词类型ID';
COMMENT ON COLUMN lumax_banned_word.word IS '违禁词内容';
COMMENT ON COLUMN lumax_banned_word.trigger_mode IS '触发方式（input/output）';
COMMENT ON COLUMN lumax_banned_word.match_mode IS '匹配方式（exact/fuzzy/semantic/model）';
COMMENT ON COLUMN lumax_banned_word.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_banned_word.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_bw_tenant_id ON lumax_banned_word(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bw_cat_id ON lumax_banned_word(category_id);
CREATE INDEX IF NOT EXISTS idx_bw_status ON lumax_banned_word(status);

-- 违禁词触发记录
CREATE TABLE IF NOT EXISTS lumax_banned_word_trigger (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL REFERENCES lumax_banned_word(id),
  category_id INTEGER NOT NULL REFERENCES lumax_banned_word_category(id),
  conversation_id INTEGER REFERENCES lumax_conversation(id),
  user_id INTEGER NOT NULL,
  trigger_time TIMESTAMP DEFAULT NOW(),
  matched_word VARCHAR(100) DEFAULT '',
  matched_sentence TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_banned_word_trigger IS '违禁词触发记录表';
COMMENT ON COLUMN lumax_banned_word_trigger.id IS '主键ID';
COMMENT ON COLUMN lumax_banned_word_trigger.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_banned_word_trigger.word_id IS '违禁词ID';
COMMENT ON COLUMN lumax_banned_word_trigger.category_id IS '违禁词类型ID';
COMMENT ON COLUMN lumax_banned_word_trigger.conversation_id IS '对话ID';
COMMENT ON COLUMN lumax_banned_word_trigger.user_id IS '用户ID';
COMMENT ON COLUMN lumax_banned_word_trigger.trigger_time IS '触发时间';
COMMENT ON COLUMN lumax_banned_word_trigger.matched_word IS '命中的违禁词';
COMMENT ON COLUMN lumax_banned_word_trigger.matched_sentence IS '命中的句子';
COMMENT ON COLUMN lumax_banned_word_trigger.created_at IS '创建时间';
CREATE INDEX IF NOT EXISTS idx_bwt_tenant_id ON lumax_banned_word_trigger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bwt_user_id ON lumax_banned_word_trigger(user_id);
CREATE INDEX IF NOT EXISTS idx_bwt_time ON lumax_banned_word_trigger(trigger_time);

-- 知识库
CREATE TABLE IF NOT EXISTS lumax_knowledge_base (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  document_count INTEGER DEFAULT 0,
  reference_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'enabled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_knowledge_base IS '知识库表';
COMMENT ON COLUMN lumax_knowledge_base.id IS '主键ID';
COMMENT ON COLUMN lumax_knowledge_base.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_knowledge_base.name IS '知识库名称';
COMMENT ON COLUMN lumax_knowledge_base.description IS '知识库描述';
COMMENT ON COLUMN lumax_knowledge_base.tags IS '标签列表';
COMMENT ON COLUMN lumax_knowledge_base.document_count IS '文档数量';
COMMENT ON COLUMN lumax_knowledge_base.reference_count IS '引用次数';
COMMENT ON COLUMN lumax_knowledge_base.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_knowledge_base.created_at IS '创建时间';
COMMENT ON COLUMN lumax_knowledge_base.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_kb_tenant_id ON lumax_knowledge_base(tenant_id);

-- 知识库文档
CREATE TABLE IF NOT EXISTS lumax_knowledge_base_document (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  knowledge_base_id INTEGER NOT NULL REFERENCES lumax_knowledge_base(id),
  file_name VARCHAR(500) DEFAULT '',
  file_size INTEGER DEFAULT 0,
  file_type VARCHAR(50) DEFAULT '',
  file_url VARCHAR(1000) DEFAULT '',
  status VARCHAR(20) DEFAULT 'processing',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
COMMENT ON TABLE lumax_knowledge_base_document IS '知识库文档表';
COMMENT ON COLUMN lumax_knowledge_base_document.id IS '主键ID';
COMMENT ON COLUMN lumax_knowledge_base_document.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_knowledge_base_document.knowledge_base_id IS '知识库ID';
COMMENT ON COLUMN lumax_knowledge_base_document.file_name IS '文件名称';
COMMENT ON COLUMN lumax_knowledge_base_document.file_size IS '文件大小（字节）';
COMMENT ON COLUMN lumax_knowledge_base_document.file_type IS '文件类型';
COMMENT ON COLUMN lumax_knowledge_base_document.file_url IS '文件地址';
COMMENT ON COLUMN lumax_knowledge_base_document.status IS '处理状态（processing/completed/failed）';
COMMENT ON COLUMN lumax_knowledge_base_document.uploaded_at IS '上传时间';
COMMENT ON COLUMN lumax_knowledge_base_document.processed_at IS '处理完成时间';
CREATE INDEX IF NOT EXISTS idx_kbd_tenant_id ON lumax_knowledge_base_document(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kbd_kb_id ON lumax_knowledge_base_document(knowledge_base_id);

-- 合作企业
CREATE TABLE IF NOT EXISTS lumax_partner_enterprise (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  brand_id INTEGER,
  brand_name VARCHAR(100) DEFAULT '',
  partner_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) DEFAULT '',
  contact_phone VARCHAR(20) DEFAULT '',
  backend_modules JSONB DEFAULT '[]',
  ai_functions JSONB DEFAULT '[]',
  user_count INTEGER DEFAULT 0,
  status INTEGER DEFAULT 0,
  del_flag INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE lumax_partner_enterprise IS '合作企业表';
COMMENT ON COLUMN lumax_partner_enterprise.id IS '主键ID';
COMMENT ON COLUMN lumax_partner_enterprise.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_partner_enterprise.brand_id IS '品牌ID';
COMMENT ON COLUMN lumax_partner_enterprise.brand_name IS '品牌名称';
COMMENT ON COLUMN lumax_partner_enterprise.partner_name IS '合作企业名称';
COMMENT ON COLUMN lumax_partner_enterprise.contact_person IS '联系人';
COMMENT ON COLUMN lumax_partner_enterprise.contact_phone IS '联系电话';
COMMENT ON COLUMN lumax_partner_enterprise.backend_modules IS '后台模块权限';
COMMENT ON COLUMN lumax_partner_enterprise.ai_functions IS 'AI功能权限';
COMMENT ON COLUMN lumax_partner_enterprise.user_count IS '用户数量';
COMMENT ON COLUMN lumax_partner_enterprise.status IS '状态（0=启用，1=禁用）';
COMMENT ON COLUMN lumax_partner_enterprise.del_flag IS '删除标记（0=正常，1=已删除）';
COMMENT ON COLUMN lumax_partner_enterprise.created_at IS '创建时间';
COMMENT ON COLUMN lumax_partner_enterprise.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_pe_tenant_id ON lumax_partner_enterprise(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pe_status ON lumax_partner_enterprise(status);

-- 品牌
CREATE TABLE IF NOT EXISTS lumax_brand (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
COMMENT ON TABLE lumax_brand IS '品牌表';
COMMENT ON COLUMN lumax_brand.id IS '主键ID';
COMMENT ON COLUMN lumax_brand.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_brand.name IS '品牌名称';
COMMENT ON COLUMN lumax_brand.created_at IS '创建时间';

-- 字典类型
CREATE TABLE IF NOT EXISTS lumax_dict_type (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT '',
  status VARCHAR(20) DEFAULT 'enabled',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, type_code)
);
COMMENT ON TABLE lumax_dict_type IS '字典类型表';
COMMENT ON COLUMN lumax_dict_type.id IS '主键ID';
COMMENT ON COLUMN lumax_dict_type.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_dict_type.type_code IS '类型编码';
COMMENT ON COLUMN lumax_dict_type.type_name IS '类型名称';
COMMENT ON COLUMN lumax_dict_type.description IS '描述';
COMMENT ON COLUMN lumax_dict_type.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_dict_type.sort_order IS '排序序号';
COMMENT ON COLUMN lumax_dict_type.created_at IS '创建时间';
COMMENT ON COLUMN lumax_dict_type.updated_at IS '更新时间';

-- 字典值
CREATE TABLE IF NOT EXISTS lumax_dict_item (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  item_value VARCHAR(100) NOT NULL,
  item_label VARCHAR(200) NOT NULL,
  parent_value VARCHAR(100),
  extra JSONB,
  status VARCHAR(20) DEFAULT 'enabled',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id, type_code) REFERENCES lumax_dict_type(tenant_id, type_code),
  UNIQUE(tenant_id, type_code, item_value)
);
COMMENT ON TABLE lumax_dict_item IS '字典项表';
COMMENT ON COLUMN lumax_dict_item.id IS '主键ID';
COMMENT ON COLUMN lumax_dict_item.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_dict_item.type_code IS '类型编码';
COMMENT ON COLUMN lumax_dict_item.item_value IS '字典值';
COMMENT ON COLUMN lumax_dict_item.item_label IS '字典标签';
COMMENT ON COLUMN lumax_dict_item.parent_value IS '父级值';
COMMENT ON COLUMN lumax_dict_item.extra IS '扩展数据';
COMMENT ON COLUMN lumax_dict_item.status IS '状态（enabled/disabled）';
COMMENT ON COLUMN lumax_dict_item.sort_order IS '排序序号';
COMMENT ON COLUMN lumax_dict_item.created_at IS '创建时间';
COMMENT ON COLUMN lumax_dict_item.updated_at IS '更新时间';
CREATE INDEX IF NOT EXISTS idx_di_tenant_id ON lumax_dict_item(tenant_id);
CREATE INDEX IF NOT EXISTS idx_di_type_code ON lumax_dict_item(type_code);
CREATE INDEX IF NOT EXISTS idx_di_type_status ON lumax_dict_item(type_code, status);

-- 用户扩展 (临时表)
CREATE TABLE IF NOT EXISTS lumax_user_ext (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  platform_ids JSONB DEFAULT '[]',
  partner_name VARCHAR(200),
  partner_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);
COMMENT ON TABLE lumax_user_ext IS '用户扩展信息表';
COMMENT ON COLUMN lumax_user_ext.id IS '主键ID';
COMMENT ON COLUMN lumax_user_ext.tenant_id IS '租户ID';
COMMENT ON COLUMN lumax_user_ext.user_id IS '用户ID';
COMMENT ON COLUMN lumax_user_ext.platform_ids IS '平台ID列表';
COMMENT ON COLUMN lumax_user_ext.partner_name IS '合作企业名称';
COMMENT ON COLUMN lumax_user_ext.partner_id IS '合作企业ID';
COMMENT ON COLUMN lumax_user_ext.created_at IS '创建时间';
COMMENT ON COLUMN lumax_user_ext.updated_at IS '更新时间';
