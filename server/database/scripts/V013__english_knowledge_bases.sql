-- Demo knowledge bases / documents → English (portfolio demo only).
-- Idempotent; only touches tenant_id = 1 rows that still have Chinese names.

UPDATE lumax_knowledge_base SET
  name = CASE id
    WHEN 1 THEN 'Influencer Knowledge Base'
    WHEN 2 THEN 'Business Analytics Library'
    WHEN 3 THEN 'Industry Insights Library'
    WHEN 4 THEN 'Internal Playbooks'
    WHEN 5 THEN 'Project Reports Library'
    ELSE name END,
  description = CASE id
    WHEN 1 THEN 'Influencer marketing knowledge, case studies, and best practices'
    WHEN 2 THEN 'Knowledge documents for influencer business analytics'
    WHEN 3 THEN 'Automotive and digital-marketing industry knowledge'
    WHEN 4 THEN 'Internal materials, standards, and process templates'
    WHEN 5 THEN 'Project retrospectives and summary reports'
    ELSE description END,
  tags = CASE id
    WHEN 1 THEN ARRAY['Influencer', 'Marketing', 'Cases']
    WHEN 2 THEN ARRAY['Data', 'Analytics', 'Reports']
    WHEN 3 THEN ARRAY['Auto', 'Industry', 'Trends']
    WHEN 4 THEN ARRAY['Standards', 'Process', 'Templates']
    WHEN 5 THEN ARRAY['Projects', 'Reviews', 'Reports']
    ELSE tags END
WHERE tenant_id = 1;

UPDATE lumax_knowledge_base_document SET file_name = CASE file_name
  WHEN '产品手册v3.0.pdf' THEN 'Product-Manual-v3.pdf'
  WHEN 'FAQ文档.docx' THEN 'FAQ.docx'
  WHEN '达人营销案例集.pdf' THEN 'Influencer-Case-Studies.pdf'
  WHEN '2026Q1业务数据报表.xlsx' THEN 'Q1-2026-Business-Report.xlsx'
  WHEN '数据分析方法论.pdf' THEN 'Data-Analysis-Playbook.pdf'
  WHEN '2026汽车行业白皮书.pdf' THEN '2026-Auto-Industry-Whitepaper.pdf'
  ELSE file_name END
WHERE tenant_id = 1;
