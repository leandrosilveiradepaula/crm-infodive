-- Add missing contact relationship fields to deals table
DO $$
BEGIN
    -- 1. client_contact_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'client_contact_id') THEN
        ALTER TABLE public.deals ADD COLUMN client_contact_id uuid REFERENCES public.account_contacts(id) ON DELETE SET NULL;
    END IF;

    -- 2. manufacturer_contact_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'manufacturer_contact_id') THEN
        ALTER TABLE public.deals ADD COLUMN manufacturer_contact_id uuid REFERENCES public.account_contacts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.deals.client_contact_id IS 'Primary decision maker contact for the client';
COMMENT ON COLUMN public.deals.manufacturer_contact_id IS 'Primary contact at the manufacturer (e.g. IBM, Lenovo)';
