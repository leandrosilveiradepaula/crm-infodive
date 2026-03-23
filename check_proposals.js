const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('proposals')
        .select('id, title, created_at, deal_id, number')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching:', error);
    } else {
        console.log('Recent proposals:', data);
    }
}

check();
