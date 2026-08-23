-- ============================================================
-- Lumax Service - 字典初始数据
-- 用途: 初始化 16 个字典类型及其字典项
-- 依赖: V001__init_lumax_tables.sql
-- 执行顺序: 第 2 个
-- 说明: tenant_id = 1 为默认租户
-- 注意: model_list 已迁移至 lumax_llm_model 表独立管理（见 V004）
-- ============================================================

-- 字典类型
INSERT INTO lumax_dict_type (tenant_id, type_code, type_name, description, sort_order) VALUES
  (1, 'agent_list', 'Agent 列表', '看板筛选、消耗明细中的 Agent 选项', 1),
  (1, 'time_filter', '时间筛选选项', '看板筛选栏时间范围', 2),
  (1, 'banned_word_category', '违禁词类型', '违禁词管理新增时的分类选项', 3),
  (1, 'risk_level', '风险等级', '违禁词风险等级', 4),
  (1, 'trigger_mode', '违禁词触发方式', '违禁词触发模式', 5),
  (1, 'match_mode', '违禁词匹配方式', '违禁词匹配模式', 6),
  (1, 'banned_word_status', '违禁词状态', '违禁词启用/禁用状态', 7),
  (1, 'intercept_status', '拦截状态', '违禁词触发记录中的拦截状态', 8),
  (1, 'quota_limit', '配额限制选项', 'Token 用户管理筛选项', 9),
  (1, 'quota_operation_type', '配额操作类型', '配额管理弹窗操作选项', 10),
  (1, 'quota_period', '配额周期', 'Token 系统管理配额重置周期', 11),
  (1, 'backend_modules', '后台功能模块', '合作企业创建时的后台功能树', 12),
  (1, 'ai_functions', 'AI 功能选项', '合作企业创建时的 AI 功能选项', 13),
  (1, 'partner_status', '合作企业状态', '合作企业筛选/表单状态', 14),
  (1, 'knowledge_base_status', '知识库状态', '知识库筛选状态', 15),
  (1, 'conversation_status', '对话状态', '对话统计筛选状态', 16)
ON CONFLICT (tenant_id, type_code) DO NOTHING;

-- agent_list
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'agent_list', 'default', '默认 Agent', 1)
ON CONFLICT DO NOTHING;

-- time_filter
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'time_filter', 'all', '全部', 1),
  (1, 'time_filter', 'yesterday', '昨日', 2),
  (1, 'time_filter', 'last7days', '近7天', 3),
  (1, 'time_filter', 'last30days', '近30天', 4)
ON CONFLICT DO NOTHING;

-- banned_word_category
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'banned_word_category', 'politics', '政治敏感', 1),
  (1, 'banned_word_category', 'violence', '暴力恐怖', 2),
  (1, 'banned_word_category', 'pornography', '色情低俗', 3),
  (1, 'banned_word_category', 'illegal_goods', '商品违法', 4),
  (1, 'banned_word_category', 'false_advertising', '虚假宣传', 5),
  (1, 'banned_word_category', 'discrimination', '歧视骚扰', 6),
  (1, 'banned_word_category', 'spam', '广告营销', 7),
  (1, 'banned_word_category', 'bad_guidance', '不良诱导', 8),
  (1, 'banned_word_category', 'privacy', '隐私侵犯', 9),
  (1, 'banned_word_category', 'hatred', '仇恨仇视', 10),
  (1, 'banned_word_category', 'other', '其他类型', 11)
ON CONFLICT DO NOTHING;

-- risk_level
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'risk_level', 'high', '高风险', 1),
  (1, 'risk_level', 'medium', '中风险', 2),
  (1, 'risk_level', 'low', '低风险', 3)
ON CONFLICT DO NOTHING;

-- trigger_mode
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'trigger_mode', 'input', '输入违禁', 1),
  (1, 'trigger_mode', 'output', '输出违禁', 2)
ON CONFLICT DO NOTHING;

-- match_mode
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'match_mode', 'exact', '精确匹配', 1),
  (1, 'match_mode', 'fuzzy', '模糊匹配', 2),
  (1, 'match_mode', 'semantic', '语义匹配', 3),
  (1, 'match_mode', 'model', '模型匹配', 4)
ON CONFLICT DO NOTHING;

-- banned_word_status
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'banned_word_status', 'enabled', '启用', 1),
  (1, 'banned_word_status', 'disabled', '禁用', 2)
ON CONFLICT DO NOTHING;

-- intercept_status
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'intercept_status', 'intercepted', '已拦截', 1),
  (1, 'intercept_status', 'not_intercepted', '未拦截', 2)
ON CONFLICT DO NOTHING;

-- quota_limit
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'quota_limit', 'yes', '是', 1),
  (1, 'quota_limit', 'no', '否', 2)
ON CONFLICT DO NOTHING;

-- quota_operation_type
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'quota_operation_type', 'noChange', '不更改配额', 1),
  (1, 'quota_operation_type', 'increase', '增加', 2),
  (1, 'quota_operation_type', 'decrease', '减少', 3),
  (1, 'quota_operation_type', 'unlimited', '不限制', 4)
ON CONFLICT DO NOTHING;

-- quota_period
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'quota_period', 'month', '当月', 1),
  (1, 'quota_period', 'day', '当日', 2),
  (1, 'quota_period', 'custom', '自定义', 3)
ON CONFLICT DO NOTHING;

-- backend_modules (树形)
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, parent_value, sort_order) VALUES
  (1, 'backend_modules', 'all', '全选', NULL, 0),
  (1, 'backend_modules', 'ai_dashboard', 'AI监控数据看板', 'all', 1),
  (1, 'backend_modules', 'ai_management', 'AI质量管理中心', 'all', 2),
  (1, 'backend_modules', 'ai_knowledge', 'AI质量知识中心', 'all', 3),
  (1, 'backend_modules', 'account_management', '账号管理中心', 'all', 4)
ON CONFLICT DO NOTHING;

-- ai_functions
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'ai_functions', 'ai_dialog', 'AI对话', 1),
  (1, 'ai_functions', 'ai_recognition', 'AI识别', 2),
  (1, 'ai_functions', 'ai_content_factory', 'AI内容工厂', 3)
ON CONFLICT DO NOTHING;

-- partner_status
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'partner_status', '0', '启用', 1),
  (1, 'partner_status', '1', '禁用', 2)
ON CONFLICT DO NOTHING;

-- knowledge_base_status
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'knowledge_base_status', 'enabled', '启用', 1),
  (1, 'knowledge_base_status', 'disabled', '禁用', 2)
ON CONFLICT DO NOTHING;

-- conversation_status
INSERT INTO lumax_dict_item (tenant_id, type_code, item_value, item_label, sort_order) VALUES
  (1, 'conversation_status', 'completed', '已完', 1),
  (1, 'conversation_status', 'ongoing', '未完', 2)
ON CONFLICT DO NOTHING;

-- 初始品牌数据
INSERT INTO lumax_brand (tenant_id, name) VALUES
  (1, '别克'), (1, '大众'), (1, '凯迪拉克'), (1, '丰田'), (1, '本田'),
  (1, '宝马'), (1, '奔驰'), (1, '奥迪'), (1, '日产'), (1, '现代')
ON CONFLICT (tenant_id, name) DO NOTHING;
