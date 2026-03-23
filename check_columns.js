const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'proposals' });

    if (error) {
        // If RPC doesn't exist, try querying information_schema if possible or just try a broad select
        console.log('RPC get_table_columns failed, trying alternative...');
        const { data: data2, error: error2 } = await supabase
            .from('proposals')
            .select('*')
            .limit(1);

        if (error2) {
            console.error('Error fetching one row:', error2);
        } else if (data2 && data2.length > 0) {
            console.log('Columns found from existing row:', Object.keys(data2[0]));
        } else {
            console.log('Table exists but is empty. Trying to guess columns by inserting a dummy (rolling back if possible or just logging error)');
            const { error: insertError } = await supabase.from('proposals').insert({ non_existent_column_test: true });
            console.log('Insert error hint:', insertError?.message);
        }
    } else {
        console.log('Columns from RPC:', data);
    }
}

checkColumns();
