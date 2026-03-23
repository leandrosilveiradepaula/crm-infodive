import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPolicies() {
    console.log('--- INSPECIONANDO POLÍTICAS RLS ATIVAS NA NUVEM VIA RPC ---');

    // Tentativa de puxar via function customizada, se não tiver vou criar o SQL no prompt
    console.log('Testando query de accounts...');
    const { data: accounts, error: accErr } = await supabase.from('accounts').select('id').limit(1);

    console.log('Conta lida:', accounts ? accounts.length : 'Nenhuma', 'Erro:', accErr?.message);

    console.log('Checando se a anon key está passando como Service Role');
    // decodificando o jwt localmente para ver se não injetaram a SSR na anon
    const jwtBase64Url = supabaseAnonKey.split('.')[1];
    if (jwtBase64Url) {
        const jwtBase64 = jwtBase64Url.replace(/-/g, '+').replace(/_/, '/');
        const buff = Buffer.from(jwtBase64, 'base64');
        const payload = JSON.parse(buff.toString('ascii'));
        console.log('Role na Chave Anon: ', payload.role);
    }

    console.log('--- FIM DA EXTRAÇÃO ---');
}

checkPolicies();
