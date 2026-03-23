-- Add health metrics columns to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS health_score integer,
ADD COLUMN IF NOT EXISTS health_trend text CHECK (health_trend IN ('stable', 'improving', 'declining')),
ADD COLUMN IF NOT EXISTS risk_factors text[],
ADD COLUMN IF NOT EXISTS last_analysis_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN deals.health_score IS 'AI-generated health score (1-10)';
COMMENT ON COLUMN deals.health_trend IS 'Trend of the deal health (stable, improving, declining)';
COMMENT ON COLUMN deals.risk_factors IS 'List of potential risks identified by AI';
COMMENT ON COLUMN deals.last_analysis_at IS 'Timestamp of the last AI analysis';
