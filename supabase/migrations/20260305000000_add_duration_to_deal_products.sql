-- Migration: Add duration columns to deal_products
-- Description: Adds duration and duration_unit columns to support custom subscription periods

ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS duration NUMERIC,
ADD COLUMN IF NOT EXISTS duration_unit TEXT;
