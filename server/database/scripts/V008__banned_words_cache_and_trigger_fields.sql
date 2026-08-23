-- ============================================================
-- Lumax Service - 违禁词缓存/匹配扩展
-- 1) 违禁词触发记录补充来源与命中方式字段
-- 2) 移除违禁词表上的单值 CHECK，支持 trigger_mode/match_mode 多值 CSV
-- ============================================================

ALTER TABLE lumax_banned_word_trigger
  ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(32),
  ADD COLUMN IF NOT EXISTS matched_mode VARCHAR(64);

COMMENT ON COLUMN lumax_banned_word_trigger.trigger_source IS '触发来源（input/output）';
COMMENT ON COLUMN lumax_banned_word_trigger.matched_mode IS '命中方式（exact/fuzzy/semantic/model/扩展值）';

CREATE INDEX IF NOT EXISTS idx_bwt_tenant_source_time
  ON lumax_banned_word_trigger(tenant_id, trigger_source, trigger_time DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_bw_trigger_mode'
      AND conrelid = 'lumax_banned_word'::regclass
  ) THEN
    ALTER TABLE lumax_banned_word DROP CONSTRAINT chk_bw_trigger_mode;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_bw_match_mode'
      AND conrelid = 'lumax_banned_word'::regclass
  ) THEN
    ALTER TABLE lumax_banned_word DROP CONSTRAINT chk_bw_match_mode;
  END IF;
END$$;
