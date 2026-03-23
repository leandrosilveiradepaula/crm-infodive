-- Add FK columns to activities to match legacy logic
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Also ensure lead_id exists if used by legacy (legacy used lead_id for customerId?)
-- Legacy hook said: `customerId: item.lead_id`. 
-- But my new schema uses `accounts` table for customers.
-- So I will map `customerId` -> `account_id` in actions.ts.
