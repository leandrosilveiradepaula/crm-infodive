-- Migration: Fix Sales Orders Status Constraint
-- Drops the old restrictive constraint and adds the new lifecycle statuses.

BEGIN;

-- 1. Identify and drop the existing constraint
-- We use 'IF EXISTS' and try to target the name 'sales_orders_status_check' 
-- which was identified in the error log.
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- 2. Add the new flexible constraint including all lifecycle steps
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_status_check 
CHECK (status IN (
    'pedido_gerado', 
    'nf_emitida', 
    'entregue', 
    'cliente_pagou', 
    'distribuidor_pagou', 
    'comissao_paga',
    'pending',   -- Keep legacy for safety during migration
    'approved', 
    'billed', 
    'in_transit', 
    'delivered', 
    'cancelled'
));

-- 3. Ensure the default value is the new standard
ALTER TABLE public.sales_orders ALTER COLUMN status SET DEFAULT 'pedido_gerado';

COMMIT;
