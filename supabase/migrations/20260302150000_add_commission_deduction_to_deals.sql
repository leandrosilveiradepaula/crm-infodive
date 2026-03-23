-- Add commission_deduction column to deals table
-- This stores the deduction percentage used for commission calculation
-- Default: 18 (18%) to match existing deals behavior
ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS commission_deduction numeric(5,2) DEFAULT 18;

-- Backfill existing deals with the default value
UPDATE deals
SET commission_deduction = 18
WHERE commission_deduction IS NULL;
