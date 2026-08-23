-- ============================================================
-- Demo data refresh (local/portfolio only)
-- Re-bases demo timestamps to the last ~14 days and backfills
-- token costs so every dashboard renders with live-looking data
-- under the default "recent" time filters.
--
-- Idempotent & safe to re-run. Only touches demo rows (tenant_id = 1).
-- Run AFTER V001–V010.
-- ============================================================

-- 1) Spread conversations across the last ~14 days (deterministic by id)
UPDATE lumax_conversation c
SET start_time = base.ts,
    end_time   = base.ts + make_interval(secs => GREATEST(c.duration_seconds, 60)),
    created_at = base.ts,
    updated_at = base.ts
FROM (
  SELECT id,
         date_trunc('day', NOW())
           - make_interval(days => ((row_number() OVER (ORDER BY id) - 1) % 14)::int)
           + make_interval(hours => (9 + (id % 8))::int, mins => ((id * 7) % 60)::int) AS ts
  FROM lumax_conversation
  WHERE tenant_id = 1
) base
WHERE c.id = base.id;

-- 2) Token consumption follows its conversation's (new) time
UPDATE lumax_token_consumption t
SET consumed_at = c.start_time + make_interval(mins => ((t.id % 6) * 3)::int)
FROM lumax_conversation c
WHERE t.conversation_id = c.id
  AND t.tenant_id = 1;

-- 3) Backfill token costs (demo rates: input ¥0.001/token, output ¥0.002/token)
UPDATE lumax_token_consumption
SET input_cost  = ROUND(input_tokens  * 0.001, 4),
    output_cost = ROUND(output_tokens * 0.002, 4),
    total_cost  = ROUND(input_tokens * 0.001 + output_tokens * 0.002, 4)
WHERE tenant_id = 1;

-- 4) Roll token cost up onto the conversation
UPDATE lumax_conversation c
SET total_cost = agg.cost
FROM (
  SELECT conversation_id, SUM(total_cost) AS cost
  FROM lumax_token_consumption
  WHERE tenant_id = 1
  GROUP BY conversation_id
) agg
WHERE c.id = agg.conversation_id;

-- 5) Feedback follows its conversation's (new) time
UPDATE lumax_feedback f
SET feedback_time = c.start_time + INTERVAL '6 minutes',
    created_at    = c.start_time + INTERVAL '6 minutes'
FROM lumax_conversation c
WHERE f.conversation_id = c.id
  AND f.tenant_id = 1;
