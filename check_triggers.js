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

async function checkTriggers() {
    console.log("--- Checking Triggers via RPC (if exists) or Error Guessing ---");
    // We'll try to use a trick to see trigger errors.
    // But since we can't easily query triggers, let's search for "TRIGGER" in ALL migrations one more time.

    const { data: trigNames, error } = await supabase.rpc('get_table_triggers', { t_name: 'documents' });
    if (error) {
        console.log("No 'get_table_triggers' RPC.");
    } else {
        console.log("Triggers:", trigNames);
    }
}

checkTriggers();
