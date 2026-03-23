ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "revenue_goal" NUMERIC;
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "goal_mode" TEXT DEFAULT 'revenue';
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "input_goal_value" NUMERIC;

COMMENT ON COLUMN "scenarios"."revenue_goal" IS 'The FINAL calculated monthly revenue target';
COMMENT ON COLUMN "scenarios"."input_goal_value" IS 'The raw value entered by the user (Revenue, Profit R$, or Profit %)';
COMMENT ON COLUMN "scenarios"."goal_mode" IS 'The mode used to calculate the goal: revenue, profit_absolute, or profit_percent';
