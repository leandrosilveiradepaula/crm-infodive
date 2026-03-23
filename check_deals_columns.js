const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDealsColumns() {
    console.log('Checking columns for table: deals');
    const { data, error } = await supabase
        .from('deals')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching deal:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('Table exists but is empty. Suggest checking via RPC or information_schema.');
    }
}

checkDealsColumns();
