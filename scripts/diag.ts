import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function diag() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('1. Checking connection and profile...');
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

    if (pError) {
        console.error('Profile error:', JSON.stringify(pError, null, 2));
        return;
    }

    console.log('Found profile:', profile.id, 'Org:', profile.organization_id);

    console.log('2. Querying deals schema and sample...');
    const { data: sampleDeal, error: sError } = await supabase
        .from('deals')
        .select('*')
        .limit(1);
    
    if (sError) {
        console.error('Schema error:', JSON.stringify(sError, null, 2));
    } else {
        console.log('Sample deal columns:', Object.keys(sampleDeal[0] || {}).join(', '));
    }

    console.log('3. Querying deals for this org...');
    const { data: deals, error: dError } = await supabase
        .from('deals')
        .select('*')
        .eq('organization_id', profile.organization_id);

    if (dError) {
        console.error('Deals error:', JSON.stringify(dError, null, 2));
    } else {
        console.log(`Success! Found ${deals?.length} deals.`);
    }
}

diag();
