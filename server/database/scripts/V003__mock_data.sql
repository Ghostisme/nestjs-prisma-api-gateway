-- ============================================================
-- Mock 数据：用于本地开发环境查看效果
-- 说明: tenant_id = 1 为默认租户
-- ============================================================

-- 用户配额
INSERT INTO lumax_user_quota (tenant_id, user_id, username, dept_id, total_quota, used_quota) VALUES
  (1, 1, 'admin', 1, -1, 3250),
  (1, 2, '丁昊宇', 1, 5000, 2500),
  (1, 3, '孙亿胜', 1, 5000, 1800),
  (1, 4, '王乐康', 2, 5000, 3200),
  (1, 5, '刘大大', 3, 3000, 1500),
  (1, 6, '丁昊哥', 3, 3000, 2800),
  (1, 7, '孙亿莉', 4, 5000, 600),
  (1, 8, '王乐嘉', 4, -1, 4100),
  (1, 9, '赵辉', 5, 5000, 2200),
  (1, 10, '胡小小', 5, 5000, 4800);

-- 配额操作记录
INSERT INTO lumax_quota_operation (tenant_id, user_id, operator_id, operator_name, operation_type, original_quota, actual_quota) VALUES
  (1, 2, 1, 'admin', 'increase', 3000, 5000),
  (1, 4, 1, 'admin', 'decrease', 8000, 5000),
  (1, 8, 1, 'admin', 'unlimited', 5000, -1),
  (1, 5, 1, 'admin', 'increase', 2000, 3000);

-- 对话记录
INSERT INTO lumax_conversation (tenant_id, thread_id, user_id, username, dept_id, model_name, agent_name, title, message_count, input_tokens, output_tokens, total_tokens, start_time, end_time, duration_seconds, satisfaction, status, banned_word_hit_count) VALUES
  (1, 't-001', 2, '丁昊宇', 1, 'DeepSeek', 'AI智能对话', '关于星鹿公司介绍', 14, 2450, 2975, 5425, '2026-04-22 11:41:00', '2026-04-22 12:41:00', 3600, 'positive', 'ended', 1),
  (1, 't-002', 3, '孙亿胜', 1, '百炼', 'AI智能对话', '产品功能咨询', 8, 1200, 1500, 2700, '2026-04-22 14:00:00', '2026-04-22 14:30:00', 1800, 'positive', 'ended', 0),
  (1, 't-003', 4, '王乐康', 2, '千问', 'AI智能对话', '业务数据分析需求', 10, 1800, 2200, 4000, '2026-04-23 09:00:00', '2026-04-23 09:45:00', 2700, 'negative', 'ended', 0),
  (1, 't-004', 5, '刘大大', 3, 'DeepSeek', 'AI内容工厂', '行业报告生成', 6, 900, 1100, 2000, '2026-04-23 10:30:00', '2026-04-23 11:00:00', 1800, 'positive', 'ended', 0),
  (1, 't-005', 2, '丁昊宇', 1, 'GLM', 'AI智能对话', '技术选型讨论', 12, 2000, 2500, 4500, '2026-04-23 13:00:00', '2026-04-23 14:00:00', 3600, 'none', 'ended', 0),
  (1, 't-006', 6, '丁昊哥', 3, 'Minimax', 'AI智能对话', '营销方案策划', 16, 3000, 3500, 6500, '2026-04-23 15:00:00', '2026-04-23 16:00:00', 3600, 'positive', 'ended', 2),
  (1, 't-007', 7, '孙亿莉', 4, '百炼', 'AI内容工厂', '文案创作需求', 4, 500, 600, 1100, '2026-04-24 09:00:00', '2026-04-24 09:20:00', 1200, 'positive', 'ended', 0),
  (1, 't-008', 8, '王乐嘉', 4, 'DeepSeek', 'AI智能对话', '客户案例整理', 8, 1400, 1600, 3000, '2026-04-24 10:00:00', '2026-04-24 10:40:00', 2400, 'negative', 'ended', 0),
  (1, 't-009', 9, '赵辉', 5, '千问', 'AI智能对话', '团队管理建议', 6, 800, 1000, 1800, '2026-04-24 14:00:00', '2026-04-24 14:30:00', 1800, 'positive', 'ended', 0),
  (1, 't-010', 10, '胡小小', 5, 'GLM', 'AI智能对话', '市场调研分析', 10, 1600, 2000, 3600, '2026-04-24 15:00:00', '2026-04-24 16:00:00', 3600, 'positive', 'ended', 1),
  (1, 't-011', 2, '丁昊宇', 1, 'DeepSeek', 'AI智能对话', '数据可视化需求', 8, 1300, 1700, 3000, '2026-04-25 09:00:00', '2026-04-25 09:40:00', 2400, 'none', 'ongoing', 0),
  (1, 't-012', 3, '孙亿胜', 1, '百炼', 'AI智能对话', '接口文档编写', 6, 1000, 1200, 2200, '2026-04-25 10:00:00', '2026-04-25 10:30:00', 1800, 'positive', 'ended', 0);

-- Token 消耗明细
INSERT INTO lumax_token_consumption (tenant_id, conversation_id, user_id, model_name, agent_name, input_tokens, output_tokens, total_tokens, response_time_ms) VALUES
  (1, 1, 2, 'DeepSeek', 'AI智能对话', 458, 318, 776, 1200),
  (1, 1, 2, 'DeepSeek', 'AI智能对话', 891, 858, 1749, 3400),
  (1, 2, 3, '百炼', 'AI智能对话', 608, 791, 1399, 2200),
  (1, 3, 4, '千问', 'AI智能对话', 395, 676, 1071, 1800),
  (1, 4, 5, 'DeepSeek', 'AI内容工厂', 705, 374, 1079, 5200),
  (1, 5, 2, 'GLM', 'AI智能对话', 861, 804, 1665, 1500),
  (1, 6, 6, 'Minimax', 'AI智能对话', 371, 512, 883, 2800),
  (1, 7, 7, '百炼', 'AI内容工厂', 500, 600, 1100, 1000),
  (1, 8, 8, 'DeepSeek', 'AI智能对话', 761, 681, 1442, 1700),
  (1, 9, 9, '千问', 'AI智能对话', 541, 340, 881, 1300),
  (1, 10, 10, 'GLM', 'AI智能对话', 1106, 980, 2086, 2100),
  (1, 11, 2, 'DeepSeek', 'AI智能对话', 650, 850, 1500, 1600),
  (1, 12, 3, '百炼', 'AI智能对话', 500, 600, 1100, 1100);

-- 反馈
INSERT INTO lumax_feedback (tenant_id, conversation_id, thread_id, message_id, user_id, message_index, result, user_question, assistant_answer, agent_name) VALUES
  (1, 1, 't-001', 'msg-001-02', 2, 1, 'positive', '请介绍一下星鹿公司', '星鹿集团成立于2015年，是一家深耕汽车行业的数字营销企业...', 'AI智能对话'),
  (1, 1, 't-001', 'msg-001-04', 2, 3, 'negative', '我们可以颠覆政治吗?', '抱歉我无法回答您这个问题。', 'AI智能对话'),
  (1, 2, 't-002', 'msg-002-02', 3, 1, 'positive', '产品有哪些核心功能？', '主要包括数据分析、内容创作、智能对话三大核心模块...', 'AI智能对话'),
  (1, 3, 't-003', 'msg-003-04', 4, 3, 'negative', '能导出Excel吗？', '目前暂不支持直接导出Excel格式...', 'AI智能对话'),
  (1, 4, 't-004', 'msg-004-02', 5, 1, 'positive', '帮我生成行业报告', '以下是2026年Q1汽车行业数字营销报告...', 'AI内容工厂'),
  (1, 6, 't-006', 'msg-006-06', 6, 5, 'positive', '帮我策划一个营销方案', '基于当前市场分析，建议采用以下营销策略...', 'AI智能对话'),
  (1, 7, 't-007', 'msg-007-02', 7, 1, 'positive', '写一段产品介绍文案', '星鹿智能营销平台，为您的品牌赋能数字化增长...', 'AI内容工厂'),
  (1, 9, 't-009', 'msg-009-02', 9, 1, 'positive', '如何提升团队协作效率？', '建议从以下几个维度优化团队协作...', 'AI智能对话'),
  (1, 10, 't-010', 'msg-010-04', 10, 3, 'positive', '分析一下新能源汽车市场', '2026年新能源汽车市场呈现以下趋势...', 'AI智能对话'),
  (1, 10, 't-010', 'msg-010-06', 10, 5, 'negative', '能提供更详细的数据吗？', '很抱歉，我目前无法获取实时市场数据...', 'AI智能对话');

-- 违禁词类型
INSERT INTO lumax_banned_word_category (tenant_id, name, risk_level, word_count, trigger_count) VALUES
  (1, '政治敏感', 'high', 8, 72),
  (1, '暴力恐怖', 'high', 5, 46),
  (1, '色情低俗', 'high', 4, 12),
  (1, '商品违法', 'medium', 6, 92),
  (1, '虚假宣传', 'medium', 5, 88),
  (1, '歧视骚扰', 'medium', 3, 5),
  (1, '广告营销', 'low', 4, 25),
  (1, '不良诱导', 'low', 3, 69);

-- 违禁词
INSERT INTO lumax_banned_word (tenant_id, category_id, word, trigger_mode, match_mode, status) VALUES
  (1, 1, '颠覆政权', 'both', 'exact', 'enabled'),
  (1, 1, '分裂国家', 'both', 'exact', 'enabled'),
  (1, 1, '反动暴乱', 'both', 'exact', 'enabled'),
  (1, 1, '批颠政治', 'both', 'fuzzy', 'enabled'),
  (1, 2, '暴力', 'both', 'fuzzy', 'enabled'),
  (1, 2, '恐怖袭击', 'both', 'exact', 'enabled'),
  (1, 3, '色情', 'output', 'fuzzy', 'enabled'),
  (1, 3, '低俗内容', 'output', 'exact', 'enabled'),
  (1, 4, '假冒伪劣', 'both', 'exact', 'enabled'),
  (1, 5, '虚假广告', 'both', 'exact', 'enabled'),
  (1, 6, '歧视', 'both', 'fuzzy', 'enabled'),
  (1, 7, '推广链接', 'output', 'exact', 'enabled'),
  (1, 8, '赌博', 'both', 'exact', 'enabled'),
  (1, 1, '暴政', 'both', 'exact', 'disabled');

-- 违禁词触发记录
INSERT INTO lumax_banned_word_trigger (tenant_id, word_id, category_id, conversation_id, user_id, matched_word, matched_sentence) VALUES
  (1, 1, 1, 1, 2, '颠覆政权', '我们可以颠覆政治吗?'),
  (1, 5, 2, 6, 6, '暴力', '如何应对暴力营销竞争?'),
  (1, 1, 1, 6, 6, '颠覆政权', '怎么颠覆现有政治制度？'),
  (1, 10, 5, 10, 10, '虚假广告', '这个产品是不是虚假广告？');

-- 知识库
INSERT INTO lumax_knowledge_base (tenant_id, name, description, tags, document_count, reference_count, status) VALUES
  (1, '达人知识库', '达人营销相关知识、案例和最佳实践', ARRAY['达人', '营销', '案例'], 89, 124, 'enabled'),
  (1, '达人业务数据知识库', '达人业务数据分析相关的知识文档', ARRAY['数据', '分析', '报表'], 45, 67, 'enabled'),
  (1, '达人行业知识库', '汽车行业及数字营销行业知识', ARRAY['汽车', '行业', '趋势'], 32, 48, 'enabled'),
  (1, '达人资料库', '公司内部资料和规范文档', ARRAY['规范', '流程', '模板'], 28, 35, 'enabled'),
  (1, '达人项目报告库', '项目复盘报告和总结', ARRAY['项目', '复盘', '报告'], 15, 22, 'disabled');

-- 知识库文档
INSERT INTO lumax_knowledge_base_document (tenant_id, knowledge_base_id, file_name, file_size, file_type, file_url, status, processed_at) VALUES
  (1, 1, '产品手册v3.0.pdf', 2048000, 'pdf', 'https://oss.example.com/docs/product-manual-v3.pdf', 'completed', NOW()),
  (1, 1, 'FAQ文档.docx', 512000, 'docx', 'https://oss.example.com/docs/faq.docx', 'completed', NOW()),
  (1, 1, '达人营销案例集.pdf', 3200000, 'pdf', 'https://oss.example.com/docs/talent-cases.pdf', 'completed', NOW()),
  (1, 2, '2026Q1业务数据报表.xlsx', 1500000, 'xlsx', 'https://oss.example.com/docs/q1-report.xlsx', 'completed', NOW()),
  (1, 2, '数据分析方法论.pdf', 800000, 'pdf', 'https://oss.example.com/docs/data-analysis.pdf', 'processing', NULL),
  (1, 3, '2026汽车行业白皮书.pdf', 5000000, 'pdf', 'https://oss.example.com/docs/auto-whitepaper.pdf', 'completed', NOW());

-- 合作企业
INSERT INTO lumax_partner_enterprise (tenant_id, brand_id, brand_name, partner_name, contact_person, contact_phone, backend_modules, ai_functions, user_count, status) VALUES
  (1, 1, '别克', '上汽通用汽车有限公司', '张经理', '13800138001', '["数据分析", "内容创作"]', '["AI智能对话", "AI内容工厂"]', 68, 0),
  (1, 2, '大众', '上汽大众汽车有限公司', '李总监', '13800138002', '["数据分析"]', '["AI智能对话"]', 90, 0),
  (1, 3, '凯迪拉克', '上汽通用汽车有限公司', '王主管', '13800138003', '["数据分析", "内容创作", "营销管理"]', '["AI智能对话", "AI内容工厂"]', 75, 0),
  (1, 4, '唐创', '阿维塔科技(重庆)汽车科技公司', '赵总', '13800138004', '["数据分析"]', '["AI智能对话"]', 47, 0),
  (1, 5, '潘达', '吉利汽车控股有限公司', '钱助理', '13800138005', '["内容创作"]', '["AI内容工厂"]', 25, 0),
  (1, 6, '朝阳/拓灯', '拜耳控(中国)汽车销售有限公司', '孙经理', '13800138006', '["数据分析", "营销管理"]', '["AI智能对话"]', 56, 0),
  (1, 7, '奇瑞', '北京奇瑞汽车有限公司', '周经理', '13800138007', '["数据分析"]', '["AI智能对话"]', 47, 0),
  (1, 8, '五菱宝光', '上汽通用五菱汽车股份有限公司', '吴主任', '13800138008', '["数据分析", "内容创作"]', '["AI智能对话", "AI内容工厂"]', 53, 1),
  (1, 9, '领克', '浙江吉利控股集团有限公司', '郑总', '13800138009', '["营销管理"]', '["AI智能对话"]', 6, 1),
  (1, 10, '吉利', '浙江吉利控股集团有限公司', '冯总监', '13800138010', '["数据分析", "内容创作", "营销管理"]', '["AI智能对话", "AI内容工厂"]', 67, 1);
