const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const p1 = await supabase.from('accounts').select('organization_id').limit(1);
    console.log('accounts:', p1.error ? p1.error.message : 'OK');
    const p2 = await supabase.from('products').select('organization_id').limit(1);
    console.log('products:', p2.error ? p2.error.message : 'OK');
    const p3 = await supabase.from('deals').select('organization_id').limit(1);
    console.log('deals:', p3.error ? p3.error.message : 'OK');
    const p4 = await supabase.from('deal_products').select('organization_id').limit(1);
    console.log('deal_products:', p4.error ? p4.error.message : 'OK');
    const p5 = await supabase.from('account_contacts').select('organization_id').limit(1);
    console.log('account_contacts:', p5.error ? p5.error.message : 'OK');
    const p6 = await supabase.from('deal_activities').select('organization_id').limit(1);
    console.log('deal_activities:', p6.error ? p6.error.message : 'OK');
    const p7 = await supabase.from('pipeline_stages').select('organization_id').limit(1);
    console.log('pipeline_stages:', p7.error ? p7.error.message : 'OK');
    const p8 = await supabase.from('app_settings').select('organization_id').limit(1);
    console.log('app_settings:', p8.error ? p8.error.message : 'OK');
}
check();
