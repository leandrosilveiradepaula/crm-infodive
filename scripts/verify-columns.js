const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Verificando colunas na tabela deal_products...');
    const { data, error } = await supabase
        .from('deal_products')
        .select('duration, duration_unit')
        .limit(1);

    if (error) {
        console.error('ERRO:', error.message);
        if (error.message.includes('column "duration_unit" does not exist')) {
            console.log('\n>>> A COLUNA duration_unit NÃO EXISTE NO BANCO DE DADOS. <<<');
        }
    } else {
        console.log('SUCESSO: As colunas existem.');
        console.log('Exemplo de dado:', data[0]);
    }
}
check();
