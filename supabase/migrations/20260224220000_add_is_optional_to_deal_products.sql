-- Add is_optional column to deal_products table
ALTER TABLE deal_products ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE;

-- Force schema cache refresh by adding a comment (Supabase/PostgREST trick)
COMMENT ON COLUMN deal_products.is_optional IS 'Whether the product is an alternative option and should be excluded from deal totals';
