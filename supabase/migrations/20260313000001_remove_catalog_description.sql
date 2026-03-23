-- Revert migration: remove "catalog_description" and "show_description_on_proposal" from deal_products
ALTER TABLE "deal_products" 
DROP COLUMN IF EXISTS "catalog_description",
DROP COLUMN IF EXISTS "show_description_on_proposal";
