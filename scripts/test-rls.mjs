import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables missing!');
    process.exit(1);
}

// Cliente anônimo padrão (simulando frontend sem sessão vazada Service Role)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSecurityTests() {
    console.log('--- INICIANDO TESTE DE INVASÃO MULTITENANT ---');

    console.log('\n[Teste 1] Tentativa de Listar Contas (Accounts) Sem Estar Logado');
    const { data: accountsRaw, error: errRaw } = await supabase.from('accounts').select('*');
    if (errRaw) {
        console.log('✅ BLOQUEADO PELO RLS:', errRaw.message);
    } else if (accountsRaw && accountsRaw.length > 0) {
        console.log('❌ FALHA CRÍTICA: Dados vazados sem sessão!', accountsRaw.length, 'registros');
    } else {
        console.log('✅ SUCESSO: RLS retornou ARRAY VAZIO para usuário deslogado.');
    }

    console.log('\n[Teste 2] Tentativa de Listar Deals (Negócios) Sem Estar Logado');
    const { data: dealsRaw, error: errDeals } = await supabase.from('deals').select('*');
    if (errDeals) {
        console.log('✅ BLOQUEADO PELO RLS:', errDeals.message);
    } else if (dealsRaw && dealsRaw.length > 0) {
        console.log('❌ FALHA CRÍTICA: Negócios vazados!', dealsRaw.length, 'registros');
    } else {
        console.log('✅ SUCESSO: RLS bloqueou leitura de Deals.');
    }

    // Criando um usuário fake e injetando sessão mockada para testar IDOR
    console.log('\n[Teste 3] Tentativa de Inserir Dado Sem Org ID (Deve disparar o Trigger de JWT ou Travar)');
    const { data: insertData, error: insertErr } = await supabase.from('accounts').insert({
        name: 'HackerCorp LTDA',
        industry: 'Tech'
    });

    if (insertErr) {
        console.log('✅ BLOQUEADO: Inserção negada por falta de credenciais / RLS de escrita.', insertErr.message);
    } else {
        console.log('❌ FALHA CRÍTICA: Tabela Accounts permitiu escrita anônima!');
    }

    console.log('\n[Teste 4] Teste da Tabela Filha "deal_products"');
    const { data: dpData, error: dpErr } = await supabase.from('deal_products').select('*');
    if (dpErr) {
        console.log('✅ SUCESSO: Tabela Filha Restringida.', dpErr.message);
    } else if (dpData && dpData.length > 0) {
        console.log('❌ FALHA: Tabela filha vazou dados sem ler a parent_id.');
    } else {
        console.log('✅ SUCESSO: Leitura de deal_products restrita a 0 linhas.');
    }

    console.log('\n--- CONCLUSÃO DO TESTE DE RLS (DESLOGADO) ---');
}

runSecurityTests();
