-- ============================================================
-- V009: 修复 lumax_dict_item 重复数据 & 添加唯一约束
-- 原因: lumax_dict_item 缺少 (tenant_id, type_code, item_value) 唯一约束，
--       导致种子脚本多次执行时 ON CONFLICT DO NOTHING 无法生效，产生重复行。
-- ============================================================

-- 1. 删除重复行，只保留每组中 id 最小的那条
DELETE FROM lumax_dict_item a
USING lumax_dict_item b
WHERE a.tenant_id  = b.tenant_id
  AND a.type_code  = b.type_code
  AND a.item_value = b.item_value
  AND a.id > b.id;

-- 2. 添加唯一约束，防止后续再出现重复
ALTER TABLE lumax_dict_item
  ADD CONSTRAINT uq_dict_item_tenant_type_value
  UNIQUE (tenant_id, type_code, item_value);
