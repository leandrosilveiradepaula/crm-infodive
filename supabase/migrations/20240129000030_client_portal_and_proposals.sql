
-- 20240129000030_client_portal_and_proposals.sql
-- Migration to add Client Portal (Deal Rooms) and Proposals

-- 1. Create deal_rooms table
CREATE TABLE IF NOT EXISTS public.deal_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    access_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_active boolean DEFAULT true,
    theme_color text DEFAULT '#0f62fe',
    company_logo_url text,
    last_accessed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- 2. Create proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    number text,
    title text NOT NULL,
    customer_id uuid, -- Link to account or lead
    customer_name text,
    customer_email text,
    status text DEFAULT 'draft',
    template text,
    version integer DEFAULT 1,
    subtotal numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    total numeric DEFAULT 0,
    valid_until timestamp with time zone,
    content jsonb DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Allow all authenticated for MVP) - idempotent
DROP POLICY IF EXISTS "Allow all auth users deal_rooms" ON public.deal_rooms;
CREATE POLICY "Allow all auth users deal_rooms" ON public.deal_rooms FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow all auth users proposals" ON public.proposals;
CREATE POLICY "Allow all auth users proposals" ON public.proposals FOR ALL USING (auth.role() = 'authenticated');

-- 5. RPC Function for Client Portal
CREATE OR REPLACE FUNCTION public.get_deal_room_by_token(token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    room_data jsonb;
BEGIN
    SELECT jsonb_build_object(
        'room', row_to_json(dr),
        'deal', jsonb_build_object(
            'title', d.title,
            'value', d.value,
            'company', d.company,
            'expected_close_date', d.expected_close_date,
            'owner', (
                SELECT jsonb_build_object(
                    'name', p.full_name,
                    'email', 'vendas@infodive.com.br', -- Fallback or fetch from profile if we adds and email column
                    'phone', p.full_name, -- Placeholder
                    'avatar', substring(p.full_name from 1 for 2)
                )
                FROM public.profiles p
                WHERE p.id = d.owner_id
            ),
            'products', (
                SELECT jsonb_agg(row_to_json(dp))
                FROM public.deal_products dp
                WHERE dp.deal_id = d.id
            )
        )
    )
    INTO room_data
    FROM public.deal_rooms dr
    JOIN public.deals d ON d.id = dr.deal_id
    WHERE dr.access_token = token_input AND dr.is_active = true;

    -- Update last access
    IF room_data IS NOT NULL THEN
        UPDATE public.deal_rooms SET last_accessed_at = now() WHERE access_token = token_input;
    END IF;

    RETURN room_data;
END;
$$;
