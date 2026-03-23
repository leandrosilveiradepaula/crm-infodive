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

async function debugInsert() {
    console.log("--- Attempting Debug Insert into 'documents' ---");
    const { data, error } = await supabase
        .from('documents')
        .insert([{
            organization_id: 'b4366e33-b8d5-4cbc-a7a7-8bd607031931', // Using UUID from logs
            entity_type: 'deal',
            entity_id: 'db8051ec-a772-477c-b49b-8f2238b9f50f', // Using UUID from logs
            created_by: 'e3aaa21b-beee-4bc1-9db2-289a8fb00d07', // Using UUID from logs
            name: 'debug_test.png',
            file_path: 'test/path.png',
            file_type: 'image/png',
            file_size: 1000,
            category: 'email_confirmacao'
        }])
        .select();

    if (error) {
        console.log("FULL ERROR OBJECT:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("Insert SUCCESSFUL! (Wait, then why did it fail for the user?)");
        console.log("Result:", data);
    }
}

debugInsert();
