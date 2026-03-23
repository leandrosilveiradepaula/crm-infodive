const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDealDetails() {
    // We need a valid deal ID. Let's try to fetch one first or use a known one.
    console.log('Fetching a sample deal...');
    const { data: deals, error: fetchError } = await supabase
        .from('deals')
        .select('id')
        .limit(1);

    if (fetchError) {
        console.error('Error fetching deals:', fetchError);
        return;
    }

    if (!deals || deals.length === 0) {
        console.log('No deals found in database.');
        return;
    }

    const dealId = deals[0].id;
    console.log(`Testing with deal ID: ${dealId}`);

    const { data: deal, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

    if (error) {
        console.error('Error fetching deal details:', error);
    } else {
        console.log('Columns found in deal object:', Object.keys(deal));
    }
}

testDealDetails();
