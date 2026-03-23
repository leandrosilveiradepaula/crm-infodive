const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(sbUrl, sbKey);

async function check() {
  const account_id = '3c1230f7-f51f-43cb-854f-80c65968913b';
  console.log('User Org:', 'b4366e33-b8d5-4cbc-a7a7-8bd607031931');
  
  const { data: acc } = await sb.from('accounts').select('id, organization_id, name').eq('id', account_id).single();
  console.log('Account:', acc);

  const { data: contacts } = await sb.from('account_contacts').select('id, account_id, name').eq('account_id', account_id);
  console.log('Contacts:', contacts?.length);
  if (contacts?.length) {
     console.log('First Contact:', contacts[0]);
  }
}
check();
