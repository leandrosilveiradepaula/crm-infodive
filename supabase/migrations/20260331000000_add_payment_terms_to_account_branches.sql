-- Create migration to add payment_terms to account_branches
ALTER TABLE public.account_branches
ADD COLUMN payment_terms text;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.account_branches.payment_terms IS 'Specific payment terms and conditions for this branch';
