-- AI Activity Suggestions table
-- Stores AI-generated activity suggestions with 24h cache
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_activity_suggestions') THEN
        CREATE TABLE public.ai_activity_suggestions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL,
            deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task')),
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            suggested_due_date DATE,
            reasoning TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
            accepted_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
        );

        -- Indexes
        CREATE INDEX idx_ai_suggestions_org_status ON public.ai_activity_suggestions(organization_id, status);
        CREATE INDEX idx_ai_suggestions_deal ON public.ai_activity_suggestions(deal_id);
        CREATE INDEX idx_ai_suggestions_expires ON public.ai_activity_suggestions(expires_at);

        -- RLS
        ALTER TABLE public.ai_activity_suggestions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their org suggestions"
            ON public.ai_activity_suggestions FOR SELECT
            USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

        CREATE POLICY "Users can manage their org suggestions"
            ON public.ai_activity_suggestions FOR ALL
            USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
    END IF;
END $$;

-- Add source column to activities if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activities' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.activities ADD COLUMN source TEXT DEFAULT 'manual'
            CHECK (source IN ('manual', 'automation', 'ai_suggestion'));
    END IF;
END $$;
