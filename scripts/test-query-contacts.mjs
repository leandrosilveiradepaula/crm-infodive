import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const account_id = '3c1230f7-f51f-43cb-854f-80c65968913b';
  const { data, error } = await sb.from('account_contacts').select('*').eq('account_id', account_id);
  console.log('Error:', error);
  console.log('Contacts for account:', data?.length);
  if (data?.length > 0) {
    console.log(data);
  }
}
run();
