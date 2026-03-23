-- Robust check and add missing contact relationship fields to deals table
-- This replaces/complements previous migrations to ensure schema stability.

DO $$
BEGIN
    -- 1. client_contact_id (Primary Decision Maker)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'client_contact_id'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN client_contact_id uuid REFERENCES public.account_contacts(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added client_contact_id to deals table';
    END IF;

    -- 2. manufacturer_contact_id (Partner Contact)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'manufacturer_contact_id'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN manufacturer_contact_id uuid REFERENCES public.account_contacts(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added manufacturer_contact_id to deals table';
    END IF;

    -- 3. distributor_contact_id (Check if exists from legacy restore)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'distributor_contact_id'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN distributor_contact_id uuid REFERENCES public.account_contacts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Standardize comments
COMMENT ON COLUMN public.deals.client_contact_id IS 'Primary decision maker contact for the client';
COMMENT ON COLUMN public.deals.manufacturer_contact_id IS 'Primary contact at the manufacturer (e.g. IBM, Lenovo)';
COMMENT ON COLUMN public.deals.distributor_contact_id IS 'Primary contact at the distributor partner';
