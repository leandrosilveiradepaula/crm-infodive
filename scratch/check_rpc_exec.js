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

async function check() {
    console.log("Checking for SQL execution RPC functions...");
    // Let's try to query the pg_proc table to see what RPCs are available, or try to run a simple SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
    console.log("exec_sql result:", data, error);
}
check();
