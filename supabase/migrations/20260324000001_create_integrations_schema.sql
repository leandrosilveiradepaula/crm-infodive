-- Migration to create integrations, api_keys, and webhooks tables
-- Created: 2026-03-24

-- 1. Create Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    status text DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    config_json jsonb DEFAULT '{}'::jsonb,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    token_prefix text NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at timestamp with time zone
);

-- 3. Create Webhooks Table
CREATE TABLE IF NOT EXISTS public.webhooks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    url text NOT NULL,
    events text[] DEFAULT '{}'::text[],
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    secret text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_triggered timestamp with time zone
);

-- 4. Ensure organization_id exists if tables were partially created
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'organization_id') THEN
        ALTER TABLE public.integrations ADD COLUMN organization_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'organization_id') THEN
        ALTER TABLE public.api_keys ADD COLUMN organization_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'organization_id') THEN
        ALTER TABLE public.webhooks ADD COLUMN organization_id uuid;
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Idempotent)
DO $$
BEGIN
    -- Integrations Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'Users can manage their integrations') THEN
        CREATE POLICY "Users can manage their integrations" ON public.integrations
        FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
    END IF;

    -- API Keys Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can manage their api keys') THEN
        CREATE POLICY "Users can manage their api keys" ON public.api_keys
        FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
    END IF;

    -- Webhooks Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhooks' AND policyname = 'Users can manage their webhooks') THEN
        CREATE POLICY "Users can manage their webhooks" ON public.webhooks
        FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
    END IF;
END $$;

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON public.integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id ON public.webhooks(organization_id);
