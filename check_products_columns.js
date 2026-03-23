const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsColumns() {
    console.log('Checking columns for table: products');
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching from products:', error);
        if (error.message.includes('column') || error.message.includes('show_sku_on_proposal')) {
            console.log('Confirmed: column show_sku_on_proposal is missing or causing issues.');
        }
    } else if (data && data.length > 0) {
        console.log('Columns found in products:', Object.keys(data[0]));
    } else {
        console.log('Table products is empty. Trying to inspect via RPC or another way...');
        // Try to get one row without specifying columns if select(*) failed
        const { data: data2, error: error2 } = await supabase.rpc('get_table_columns', { table_name: 'products' });
        if (error2) {
            console.log('RPC get_table_columns failed or not found.');
        } else {
            console.log('Columns via RPC:', data2);
        }
    }
}

checkProductsColumns();
