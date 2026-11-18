-- CRM Infodive #214 B4 — QA-only goal-module compatibility patch
-- Target Supabase lwpjiufsetnpjuoyline; never run on production.
-- Source contracts: src/types/goal.ts and src/app/(dashboard)/goals/actions.ts.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $guard$
BEGIN
 IF to_regclass('public.scenarios') IS NULL OR to_regclass('public.campaigns') IS NULL
 OR to_regclass('public.profiles') IS NULL OR to_regnamespace('crm_qa_internal') IS NULL
 THEN RAISE EXCEPTION 'QA goals compatibility refused: synthetic QA baseline missing'; END IF;
END;
$guard$;

ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS fixed_costs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS variable_costs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS desired_margin numeric NOT NULL DEFAULT 0;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS headcount integer NOT NULL DEFAULT 0;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS staff jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS quarterly_percentages jsonb NOT NULL
 DEFAULT '{"q1":25,"q2":25,"q3":25,"q4":25}'::jsonb;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS payroll_tax numeric;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS input_goal_value numeric;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS goal_mode text;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS seller_weights jsonb;

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS commission_absolute numeric NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Preserve fail-closed database grants; no anonymous/authenticated write paths.
REVOKE ALL ON public.scenarios, public.campaigns FROM PUBLIC, anon, authenticated;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
COMMIT;