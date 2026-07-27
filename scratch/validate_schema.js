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

async function validate() {
    console.log("Validating columns in 'documents' table...");
    
    // We can try to select one row including the new columns to verify if they exist
    const { data, error } = await supabase
        .from('documents')
        .select('id, parent_id, version, quote_id')
        .limit(1);
        
    if (error) {
        console.error("❌ Validation Failed:", error.message);
    } else {
        console.log("✅ Validation Succeeded! The columns exist and can be successfully queried.");
        console.log("Query Sample:", data);
    }
}

validate();
