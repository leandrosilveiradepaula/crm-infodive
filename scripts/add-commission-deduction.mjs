// Script to add commission_deduction column to deals table via Supabase Admin API
// Run with: node scripts/add-commission-deduction.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpmhmjepmmpxbsmekldf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWhtamVwbW1weGJzbWVrbGRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjgzMiwiZXhwIjoyMDgzMDcyODMyfQ.M9p9y9VqUGyCjXVb9OWnAVNNMg1aWHfBDueOLIpkyU0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test if column already exists by trying to select it
const { data: existsCheck, error: existsErr } = await supabase
    .from('deals')
    .select('commission_deduction')
    .limit(1);

if (!existsErr) {
    console.log('✅ Column commission_deduction already exists!');
    console.log('Sample data:', existsCheck);
    process.exit(0);
}

console.log('Column does not exist yet. Error:', existsErr.message);
console.log('\n⚠️  You need to run this SQL in the Supabase dashboard SQL editor:');
console.log('---');
console.log(`ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS commission_deduction numeric(5,2) DEFAULT 18;

UPDATE deals
SET commission_deduction = 18
WHERE commission_deduction IS NULL;`);
console.log('---');
console.log('\nGo to: https://supabase.com/dashboard/project/mpmhmjepmmpxbsmekldf/sql/new');
