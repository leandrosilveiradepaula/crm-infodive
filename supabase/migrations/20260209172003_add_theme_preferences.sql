-- Migration: Add theme preferences for multi-tenant SaaS

-- User-level theme preference (overrides org theme)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT CHECK (theme_preference IN ('light', 'dark'));

COMMENT ON COLUMN profiles.theme_preference IS 'User personal theme preference, overrides organization default';

-- Performance index (idempotent)
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme_preference) WHERE theme_preference IS NOT NULL;

-- NOTE: Organization-level theme settings are stored in app_settings as a key/value row.
-- The 'organizations' table does not exist in this schema. Org themes are managed via app_settings.
