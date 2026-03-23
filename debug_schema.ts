import { createAdminClient } from './src/lib/supabase/admin';

async function debugSchema() {
    const supabase = createAdminClient();

    console.log('--- Checking tables ---');

    const tables = ['sales_orders', 'sales_order_items', 'documents'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        const { error: existsError } = await supabase.from(table).select('*').limit(0);
        if (existsError) {
            console.error(`Table ${table} error:`, existsError.message || existsError);
        } else {
            console.log(`Table ${table} exists!`);
            // Try to fetch one row to see columns if possible
            const { data, error: rowError } = await supabase.from(table).select('*').limit(1);
            if (!rowError && data && data.length > 0) {
                console.log('Sample row columns:', Object.keys(data[0]));
            } else if (rowError) {
                console.log('Could not fetch sample row:', rowError.message);
            } else {
                console.log('Table is empty, cannot infer columns from data.');
            }
        }
    }
}

debugSchema();
