-- Migration to create audit_logs table and ensure organization_id exists
-- Created: 2026-03-24

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    user_name text NOT NULL,
    action text NOT NULL,
    details text,
    category text DEFAULT 'system',
    ip_address text DEFAULT '0.0.0.0',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add organization_id if table existed but column was missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN organization_id uuid;
        -- If we just added it, we might need to backfill it or make it NOT NULL later.
        -- For now, let's just ensure it's there.
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Users can view logs of their organization'
    ) THEN
        CREATE POLICY "Users can view logs of their organization" 
        ON public.audit_logs 
        FOR SELECT 
        USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'System can insert logs'
    ) THEN
        -- Allow insertion for authenticated users. 
        -- The organization_id is enforced by the app logic in audit-actions.ts
        CREATE POLICY "System can insert logs" 
        ON public.audit_logs 
        FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
