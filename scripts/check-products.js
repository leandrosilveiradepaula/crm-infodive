const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: products, error } = await supabase.from('products').select('*');
    console.log('Products Error:', error);
    console.log('Products Count:', products ? products.length : 0);
    if (products && products.length > 0) {
        console.log('Sample Product:', products[0]);
    }
}

main();
