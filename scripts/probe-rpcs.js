const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listFunctions() {
    console.log('Listando funções RPC disponíveis...');
    // We can't directly list functions via standard select unless we have access to pg_proc
    // But we can try to call a known system function or just try common names
    const commonNames = ['exec_sql', 'execute_sql', 'run_sql', 'sql', 'query'];

    for (const name of commonNames) {
        try {
            const { error } = await supabase.rpc(name, { sql: 'SELECT 1' });
            if (error && error.message.includes('function') && error.message.includes('does not exist')) {
                // console.log(`- ${name}: Não existe`);
            } else {
                console.log(`- ${name}: POSSÍVEL MATCH (Erro: ${error?.message || 'Nenhum'})`);
            }
        } catch (e) { }
    }
}
listFunctions();
