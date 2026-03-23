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

async function mockEmailSync() {
    console.log('--- TESTE: SIMULANDO SINCRONIZAÇÃO DE EMAIL COM ASSINATURA NOVA ---');

    // Simula o payload de 1 email que viria do Microsoft Graph API
    const authResponse = await supabase.auth.signInWithPassword({
        email: 'admin@crm-next.com', // Altere para um email valido no seu banco local se falhar
        password: 'password123'      // Senha local
    });

    if (authResponse.error) {
        console.log('⚠️ Aviso: Teste requer Login para disparar API interna:', authResponse.error.message);
        // Continua o teste direto no gemini se falhar o login supabase (testando apenas o endpoit da IA)
    }

    const testEmailBody = `
        Olá equipe, gostariamos de avançar com o plano corporativo C.
        Seguimos à disposição.

        Atenciosamente,

        Marcos Torres
        Diretor de Suprimentos | TechCorp Solutions
        Tel: (11) 4002-8922
        Cel/WhatsApp: (11) 99888-7766
        marcos.torres@techcorp.com.br
        Av. Faria Lima, 3000 - São Paulo, SP
        https://linkedin.com/in/marcostorres
        www.techcorp.com.br
    `;

    console.log('1. Instanciando Gemini Localmente para Teste...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    console.log('2. Enviando Corpo do E-mail para a IA ...');

    try {
        const promptParts = [`Texto da assinatura ou e-mail:\n"""\n${testEmailBody}\n"""`];
        promptParts.push(`
        Analise o texto fornecido (pode ser uma assinatura simples ou o corpo de um e-mail inteiro).
        Se for um e-mail longo, role até o final/assinatura do remetente e concentre-se *exclusivamente* em extrair os dados profissionais de contato dessa pessoa que enviou o email.
        Extraia os dados em formato JSON estrito, sem markdown.
        
        Campos requeridos (retorne null se não encontrar):
        - name (Nome completo da pessoa assinando)
        - email (E-mail da pessoa)
        - mobile_phone (Celular - Formato Livre, de preferência mantenha o DDI/DDD)
        - landline_phone (Telefone Fixo)
        - whatsapp (Se aplicável)
        - role (Cargo / Título)
        - company (Empresa / Organização)
        - address (Endereço físico)
        - linkedin (URL do LinkedIn se houver)
        - website (Site da empresa)
        `);
        const result = await model.generateContent(promptParts);
        const text = result.response.text();
        const jsonString = text.replace(/```json\n|\n```/g, '').trim();
        const contactData = JSON.parse(jsonString);

        console.log('✅ Retorno da IA Extraído (JSON):');
        console.log(JSON.stringify(contactData, null, 2));

        if (contactData && contactData.name === 'Marcos Torres') {
            console.log('✅ SUCESSO! O Gemini conseguiu isolar e formatar perfeitamente a assinatura do corpo de email.');
        } else {
            console.log('❌ O Gemini retornou um parse impreciso.');
        }

    } catch (err) {
        console.error('❌ Erro de Fetch:', err);
    }
}

mockEmailSync();
