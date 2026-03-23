-- Migration: Create Relational Sales Order Installments (FIXED SCHEMA)
-- Drops the temporary JSONB boletos column and creates a dedicated relational table
-- Following project standard: UUID organization_id without foreign key to missing table

BEGIN;

-- 1. Drop the JSONB column if it was created
ALTER TABLE public.sales_orders DROP COLUMN IF EXISTS boletos;

-- 2. Create the installments table
CREATE TABLE IF NOT EXISTS public.sales_order_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_order_installments_org ON public.sales_order_installments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_installments_order ON public.sales_order_installments(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_installments_status ON public.sales_order_installments(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sales_order_installments ENABLE ROW LEVEL SECURITY;

-- 5. Strict Tenant Isolation Policies (Matching project standard)
DROP POLICY IF EXISTS "Tenant Isolation" ON public.sales_order_installments;
CREATE POLICY "Tenant Isolation" ON public.sales_order_installments FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column_installments()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sales_order_installments_modtime ON public.sales_order_installments;
CREATE TRIGGER update_sales_order_installments_modtime
BEFORE UPDATE ON public.sales_order_installments
FOR EACH ROW EXECUTE FUNCTION update_modified_column_installments();

COMMIT;
