-- Migration: Sales Order Lifecycle Expansion
-- Adds fields for invoice tracking, billing responsibility, and financial statuses.

BEGIN;

-- Expand sales_orders table
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS tax_invoice_number text,
ADD COLUMN IF NOT EXISTS billing_entity text, -- 'infodive' or 'distributor'
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending', -- pending, paid, partial
ADD COLUMN IF NOT EXISTS commission_status text DEFAULT 'pending', -- pending, paid
ADD COLUMN IF NOT EXISTS notes text;

-- Standardize status comments/documentation (Postgres doesn't enforce enums easily in a migration without dropping but we can use check constraints if desired)
-- For now, we will rely on application logic for these specific status values:
-- 'pedido_gerado', 'nf_emitida', 'entregue', 'cliente_pagou', 'distribuidor_pagou', 'comissao_paga'

-- Add a check constraint for billing_entity to ensure data integrity
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS check_billing_entity;
ALTER TABLE public.sales_orders ADD CONSTRAINT check_billing_entity CHECK (billing_entity IN ('infodive', 'distributor'));

-- Ensure RLS is reaffirmed for any new columns (standard for this project)
-- The existing "Tenant Isolation" policy on sales_orders already covers all columns.

COMMIT;
