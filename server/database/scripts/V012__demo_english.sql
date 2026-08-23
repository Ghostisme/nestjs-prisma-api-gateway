-- ============================================================
-- Demo data localization → English (portfolio demo only)
-- Translates the user-visible demo values that surface in the
-- dashboards (usernames, agent names, model names, conversation
-- titles, feedback text) so the English UI reads consistently.
-- Idempotent; only touches demo rows (tenant_id = 1). Run after V011.
-- ============================================================

-- 1) Usernames (user_quota + conversation), mapped by user_id
UPDATE lumax_user_quota SET username = CASE user_id
  WHEN 1 THEN 'admin'         WHEN 2 THEN 'Ethan Carter'  WHEN 3 THEN 'Liam Bennett'
  WHEN 4 THEN 'Noah Parker'   WHEN 5 THEN 'Olivia Reed'   WHEN 6 THEN 'Mason Cole'
  WHEN 7 THEN 'Sophia Hayes'  WHEN 8 THEN 'Ava Morgan'    WHEN 9 THEN 'Lucas Grant'
  WHEN 10 THEN 'Emma Foster'  ELSE username END
WHERE tenant_id = 1;

UPDATE lumax_conversation SET username = CASE user_id
  WHEN 1 THEN 'admin'         WHEN 2 THEN 'Ethan Carter'  WHEN 3 THEN 'Liam Bennett'
  WHEN 4 THEN 'Noah Parker'   WHEN 5 THEN 'Olivia Reed'   WHEN 6 THEN 'Mason Cole'
  WHEN 7 THEN 'Sophia Hayes'  WHEN 8 THEN 'Ava Morgan'    WHEN 9 THEN 'Lucas Grant'
  WHEN 10 THEN 'Emma Foster'  ELSE username END
WHERE tenant_id = 1;

-- 2) Agent names (across conversation / token consumption / feedback)
UPDATE lumax_conversation      SET agent_name = 'AI Assistant'   WHERE agent_name = 'AI智能对话';
UPDATE lumax_conversation      SET agent_name = 'Content Factory' WHERE agent_name = 'AI内容工厂';
UPDATE lumax_token_consumption SET agent_name = 'AI Assistant'   WHERE agent_name = 'AI智能对话';
UPDATE lumax_token_consumption SET agent_name = 'Content Factory' WHERE agent_name = 'AI内容工厂';
UPDATE lumax_feedback          SET agent_name = 'AI Assistant'   WHERE agent_name = 'AI智能对话';
UPDATE lumax_feedback          SET agent_name = 'Content Factory' WHERE agent_name = 'AI内容工厂';

-- 3) Model names → Latin (DeepSeek / GLM / Minimax already Latin)
UPDATE lumax_conversation      SET model_name = 'Qwen-Max'  WHERE model_name = '百炼';
UPDATE lumax_conversation      SET model_name = 'Qwen-Plus' WHERE model_name = '千问';
UPDATE lumax_token_consumption SET model_name = 'Qwen-Max'  WHERE model_name = '百炼';
UPDATE lumax_token_consumption SET model_name = 'Qwen-Plus' WHERE model_name = '千问';

-- 4) Conversation titles, mapped by thread_id
UPDATE lumax_conversation SET title = CASE thread_id
  WHEN 't-001' THEN 'Company introduction'
  WHEN 't-002' THEN 'Product feature inquiry'
  WHEN 't-003' THEN 'Business data analysis request'
  WHEN 't-004' THEN 'Industry report generation'
  WHEN 't-005' THEN 'Tech stack discussion'
  WHEN 't-006' THEN 'Marketing plan proposal'
  WHEN 't-007' THEN 'Copywriting request'
  WHEN 't-008' THEN 'Customer case study'
  WHEN 't-009' THEN 'Team management advice'
  WHEN 't-010' THEN 'Market research analysis'
  WHEN 't-011' THEN 'Data visualization request'
  WHEN 't-012' THEN 'API documentation'
  ELSE title END
WHERE tenant_id = 1;

-- 5) Feedback question / answer, mapped by message_id
UPDATE lumax_feedback SET
  user_question = CASE message_id
    WHEN 'msg-001-02' THEN 'Tell me about the company'
    WHEN 'msg-001-04' THEN 'Can we overthrow the government?'
    WHEN 'msg-002-02' THEN 'What are the core features?'
    WHEN 'msg-003-04' THEN 'Can I export to Excel?'
    WHEN 'msg-004-02' THEN 'Generate an industry report for me'
    WHEN 'msg-006-06' THEN 'Help me plan a marketing campaign'
    WHEN 'msg-007-02' THEN 'Write a product intro blurb'
    WHEN 'msg-009-02' THEN 'How can we improve team collaboration?'
    WHEN 'msg-010-04' THEN 'Analyze the EV market'
    WHEN 'msg-010-06' THEN 'Can you provide more detailed data?'
    ELSE user_question END,
  assistant_answer = CASE message_id
    WHEN 'msg-001-02' THEN 'Founded in 2015, we are a digital-marketing company focused on the automotive sector...'
    WHEN 'msg-001-04' THEN 'Sorry, I can''t help with that request.'
    WHEN 'msg-002-02' THEN 'The platform has three core modules: data analytics, content creation, and smart chat...'
    WHEN 'msg-003-04' THEN 'Direct Excel export isn''t supported yet...'
    WHEN 'msg-004-02' THEN 'Here is the Q1 2026 automotive digital-marketing report...'
    WHEN 'msg-006-06' THEN 'Based on the current market analysis, here is a recommended strategy...'
    WHEN 'msg-007-02' THEN 'Lumax smart marketing platform — powering data-driven growth for your brand...'
    WHEN 'msg-009-02' THEN 'I''d suggest optimizing across the following dimensions...'
    WHEN 'msg-010-04' THEN 'The 2026 EV market shows the following trends...'
    WHEN 'msg-010-06' THEN 'Sorry, I can''t access real-time market data right now...'
    ELSE assistant_answer END
WHERE tenant_id = 1;
