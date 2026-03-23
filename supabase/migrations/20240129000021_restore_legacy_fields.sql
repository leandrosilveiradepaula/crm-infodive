
-- RESTORE LEGACY FIELDS
-- This script adds the missing columns needed for the legacy ViewDealModal restoration.

DO $$
BEGIN
    -- 1. Table: public.deals
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'billing_type') THEN
        ALTER TABLE public.deals ADD COLUMN billing_type text DEFAULT 'direct';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'distributor_id') THEN
        ALTER TABLE public.deals ADD COLUMN distributor_id uuid REFERENCES public.accounts(id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'distributor_contact_id') THEN
        ALTER TABLE public.deals ADD COLUMN distributor_contact_id uuid REFERENCES public.account_contacts(id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.deals ADD COLUMN supplier_id uuid REFERENCES public.accounts(id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'custom_fields') THEN
        ALTER TABLE public.deals ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- 2. Table: public.deal_products
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'sku') THEN
        ALTER TABLE public.deal_products ADD COLUMN sku text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'description') THEN
        ALTER TABLE public.deal_products ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'cost') THEN
        ALTER TABLE public.deal_products ADD COLUMN cost numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'margin') THEN
        ALTER TABLE public.deal_products ADD COLUMN margin numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'is_bid') THEN
        ALTER TABLE public.deal_products ADD COLUMN is_bid boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'bid_number') THEN
        ALTER TABLE public.deal_products ADD COLUMN bid_number text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'bid_validity') THEN
        ALTER TABLE public.deal_products ADD COLUMN bid_validity date;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'is_usd') THEN
        ALTER TABLE public.deal_products ADD COLUMN is_usd boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'usd_cost') THEN
        ALTER TABLE public.deal_products ADD COLUMN usd_cost numeric;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'exchange_rate') THEN
        ALTER TABLE public.deal_products ADD COLUMN exchange_rate numeric;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'display_order') THEN
        ALTER TABLE public.deal_products ADD COLUMN display_order integer DEFAULT 0;
    END IF;

END $$;

-- Update RLS if needed (but we have 'Allow all auth users' which covers schema changes)
