-- Migration: Clean up legacy Sales Order statuses
-- Maps old statuses to the new standardized lifecycle.

BEGIN;

-- Update pending and approved to 'pedido_gerado'
UPDATE public.sales_orders 
SET status = 'pedido_gerado' 
WHERE status IN ('pending', 'approved', 'cancelled');

-- Update billed to 'nf_emitida'
UPDATE public.sales_orders 
SET status = 'nf_emitida' 
WHERE status = 'billed';

-- Update in_transit and delivered to 'entregue'
UPDATE public.sales_orders 
SET status = 'entregue' 
WHERE status IN ('in_transit', 'delivered');

COMMIT;
