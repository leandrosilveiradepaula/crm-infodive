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

async function inspectMetadata() {
    console.log("--- Inspecting Policies ---");
    // Since we don't have direct access to pg_policies via PostgREST easily,
    // we can try to use a trick: RPC or a known table if the user has one.
    // If not, we'll try to select from a non-existent table to see if we can get schema info 
    // from error hints, but that's unlikely for policies.

    // Most likely: the user has 'uploaded_by' in a TRIGGER or a POLICY.
    // Let's try to query public schemas if possible.

    // I'll try to use the 'rpc' to get policies if it exists.
    const { data: policies, error: polErr } = await supabase.rpc('get_policies'); // Common helper in some projects
    if (polErr) {
        console.log("RPC 'get_policies' failed. Trying to force RLS error...");
        // If we select from the table as a non-admin, RLS applies.
        // But here we are using SERVICE_ROLE_KEY, which BYPASSES RLS.
        // To test RLS, we should use a regular user token or force a policy check.

        console.log("Checking for triggers via common RPC if exists...");
        const { error: trigErr } = await supabase.rpc('get_triggers');
        if (trigErr) console.log("RPC 'get_triggers' also failed.");
    } else {
        console.log("Policies found:", policies);
    }
}

async function listColumnsProperly() {
    console.log("--- Listing ALL columns for 'documents' ---");
    // We can try to get column names by selecting a single row and checking object keys.
    const { data, error } = await supabase.from('documents').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No rows in documents to check columns.");
    }
}

inspectMetadata();
listColumnsProperly();
