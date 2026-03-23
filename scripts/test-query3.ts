import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data, error } = await sb.from('account_contacts').select('*');
  console.log('Error:', error);
  console.log('Total contacts in DB:', data?.length);
  if (data && data.length > 0) {
    console.log('First 5 contacts:');
    console.log(data.slice(0, 5).map(c => `ID: ${c.id}, Account ID: ${c.account_id}, Name: ${c.name}`));
  }
}
run();
