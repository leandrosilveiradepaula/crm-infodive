// Script to help add organization_id to the profiles table via Supabase Admin API
// Run with: node scripts/add-org-to-profiles.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpmhmjepmmpxbsmekldf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWhtamVwbW1weGJzbWVrbGRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjgzMiwiZXhwIjoyMDgzMDcyODMyfQ.M9p9y9VqUGyCjXVb9OWnAVNNMg1aWHfBDueOLIpkyU0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test if column already exists by trying to select it
const { data: existsCheck, error: existsErr } = await supabase
    .from('profiles')
    .select('organization_id')
    .limit(1);

if (!existsErr) {
    console.log('✅ Column organization_id already exists on profiles table!');
    process.exit(0);
}

console.log('Column does not exist yet. Error:', existsErr.message);
console.log('\n⚠️  You need to run this SQL in the Supabase dashboard SQL editor:');
console.log('---');
console.log(`-- Add organization_id to profiles if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Optional: Link it to the organizations table if you have one, or just index it
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- Note: You may want to manually assign an organization_id to existing users 
-- if they are currently null, e.g:
-- UPDATE public.profiles SET organization_id = 'YOUR-ORG-UUID' WHERE organization_id IS NULL;`);
console.log('---');
console.log('\nGo to: https://supabase.com/dashboard/project/mpmhmjepmmpxbsmekldf/sql/new');
