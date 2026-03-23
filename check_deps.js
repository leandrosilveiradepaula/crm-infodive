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

async function checkDependencies() {
    console.log("--- Checking dependencies for 'uploaded_by' in 'documents' ---");

    // We can use a trick: try to drop the column and see the error message
    // Actually, we can't do that easily via JS client without RPC.
    // Let's try to find if there are any views using it.

    const { data, error } = await supabase.from('information_schema_columns_view').select('table_name').eq('column_name', 'uploaded_by');
    if (error) {
        console.log("Could not use custom view. Using generic check for 'uploaded_by' existence...");
        const { data: dummy, error: dummyErr } = await supabase.from('documents').select('uploaded_by').limit(1);
        if (dummyErr) {
            console.log("uploaded_by does not seem to exist (or access denied).");
        } else {
            console.log("uploaded_by EXISTS.");
            // Try to see if it's NOT NULL
            const { error: insErr } = await supabase.from('documents').insert([{
                organization_id: '00000000-0000-0000-0000-000000000000',
                entity_type: 'test',
                entity_id: '00000000-0000-0000-0000-000000000000',
                name: 'test',
                file_path: 'test',
                created_by: null // We send created_by but NOT uploaded_by
            }]);
            console.log("Insert Error (should confirm NOT NULL violation):", insErr ? insErr.message : "Success? (Then it is nullable now)");
        }
    }
}

checkDependencies();
