const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        env.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
        });
    } catch (e) { }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTable(tableName) {
    console.log(`\n--- Columns for '${tableName}' ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        if (error.code === '42703') {
            console.log(`ERROR: Table '${tableName}' has an undefined column in its default query/policy.`);
            console.log("Message:", error.message);
        } else {
            console.log(`Error checking '${tableName}':`, error.message);
        }
    } else if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log("Table is empty. Force error to see columns...");
        const { error: forceErr } = await supabase.from(tableName).select('non_existent').limit(1);
        if (forceErr && forceErr.message.includes('column')) {
            console.log(forceErr.message);
        }
    }
}

async function run() {
    await inspectTable('documents');
    await inspectTable('sales_orders');
    await inspectTable('sales_order_items');
}

run();
