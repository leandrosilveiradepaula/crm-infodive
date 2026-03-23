-- Migration: Add duration columns to products table
-- Description: Adds duration and duration_unit columns to support default subscription periods in the catalog

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS duration NUMERIC,
ADD COLUMN IF NOT EXISTS duration_unit TEXT;
