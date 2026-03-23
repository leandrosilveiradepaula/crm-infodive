import { NextRequest, NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONFIG } from '@/lib/config';

// Delay helper to throttle Gemini API calls and avoid rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Direct Gemini SDK call — avoids internal HTTP fetch that gets blocked by middleware auth check
async function parseSignatureWithGemini(emailBody: string): Promise<Record<string, any> | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('🤖 Automagic: GEMINI_API_KEY não configurado.');
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analise o texto fornecido (pode ser uma assinatura simples ou o corpo de um e-mail inteiro).
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

Texto da assinatura ou e-mail:
"""
${emailBody}
"""

Retorne SOMENTE o JSON, sem markdown, sem código, sem texto adicional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    // Gemini sometimes returns an array when the email has multiple signatures (thread).
    // Normalize: if array, return the first element (the most recent/relevant signer).
    if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed[0] : null;
    }

    return parsed;
}

export async function GET(request: NextRequest) {
    // 1. Auth guard (iron-session)
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get provider token from cookie (set during OAuth callback)
    const providerToken = request.cookies.get('crm_provider_token')?.value;

    if (!providerToken) {
        return NextResponse.json({ error: 'Not authenticated or missing provider token. Please sign in with Office 365.' }, { status: 401 });
    }

    try {

        // Fetch emails from Microsoft Graph API (Requesting full body for signature extraction)
        const response = await fetch(`${CONFIG.API.MS_GRAPH}/me/messages?$top=20&$select=sender,subject,bodyPreview,body,receivedDateTime,isRead,categories&$orderby=receivedDateTime DESC`, {
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Graph API Error:', errorText);

            if (response.status === 401) {
                return NextResponse.json({ error: 'Microsoft API token expired or invalid.' }, { status: 401 });
            }

            throw new Error(`Graph API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const emails = data.value.map((msg: any) => ({
            id: msg.id,
            sender: {
                name: msg.sender.emailAddress.name,
                email: msg.sender.emailAddress.address,
                avatar: '' // Graph API requires extra call for photo, skipping for now
            },
            subject: msg.subject,
            preview: msg.bodyPreview,
            body: msg.body?.content || '',
            date: msg.receivedDateTime,
            read: msg.isRead,
            labels: msg.categories || [],
            folder: 'inbox' // Simplified for now
        }));

        // --- INÍCIO DA AUTOMAÇÃO DE CADASTRO DE CONTATOS (FIRE-AND-FORGET) ---
        // Não prendemos o await aqui para não travar o carregamento da lista de e-mails no frontend.
        const orgId = organizationId;

        if (orgId && emails.length > 0) {
            // 1. Isolar remetentes únicos
            const uniqueSenders = Array.from(new Set(emails.map((e: any) => e.sender.email).filter(Boolean)));

            if (uniqueSenders.length > 0) {
                // Dispara logica em background
                Promise.resolve().then(async () => {
                    try {
                        const bgSupabase = createAdminClient();

                        // 2. Procurar quais remetentes JÁ existem no CRM (Contacts)
                        const { data: existingContacts } = await bgSupabase
                            .from('account_contacts')
                            .select('email')
                            .in('email', uniqueSenders);

                        // 2.5 Verificar quem está na BLOCKLIST (Ignorados pelo Usuário)
                        const { data: blacklistedContacts } = await bgSupabase
                            .from('contact_blacklists')
                            .select('email')
                            .in('email', uniqueSenders);

                        const existingEmailsArray = [
                            ...(existingContacts?.map((c: any) => c.email.toLowerCase()) || []),
                            ...(blacklistedContacts?.map((c: any) => c.email.toLowerCase()) || [])
                        ];
                        const existingEmails = new Set(existingEmailsArray);

                        // 3. Filtrar os emails que pertencem a Pessoas Não Cadastradas
                        const unknownEmails = emails.filter((e: any) => !existingEmails.has(e.sender.email.toLowerCase()));

                        // Mapa para não processar a mesma pessoa duas vezes se ela mandou 3 emails seguidos
                        const processedUnknowns = new Set();

                        for (const email of unknownEmails) {
                            if (processedUnknowns.has(email.sender.email)) continue;
                            processedUnknowns.add(email.sender.email);

                            if (!email.body || email.body.length < 20) {
                                continue; // Evita emails vazios
                            }

                            console.log(`🤖 Automagic: Analisando assinatura para ${email.sender.email}...`);

                            // 4. Chama o SDK do Gemini DIRETAMENTE (sem fetch interno)
                            // Fetch interno seria bloqueado pelo middleware de auth do Next.js

                            // Delay entre chamadas para evitar rate limit
                            await sleep(1500);

                            try {
                                const contactData = await parseSignatureWithGemini(email.body);

                                // Dados suficientes = qualquer campo com informação util além do email do remetente
                                const hasSufficientData = contactData && (
                                    contactData.name ||
                                    contactData.mobile_phone ||
                                    contactData.landline_phone ||
                                    contactData.role ||
                                    contactData.company ||
                                    contactData.email
                                );

                                if (hasSufficientData) {
                                    // 5. Inserir Silenciosamente a Sugestão do Novo Contato no Inbox de Revisão
                                    const newSuggestion = {
                                        organization_id: orgId,
                                        name: contactData.name || email.sender.name,
                                        email: contactData.email || email.sender.email,
                                        phone: contactData.mobile_phone || contactData.whatsapp || contactData.landline_phone || null,
                                        role: contactData.role || null,
                                        company_name: contactData.company || null,
                                        status: 'pending'
                                    };

                                    const { error: insertError } = await bgSupabase
                                        .from('contact_suggestions')
                                        .upsert([newSuggestion], { onConflict: 'organization_id, email', ignoreDuplicates: true });
                                    if (insertError) {
                                        console.error('🤖 Automagic: Falha ao inserir na tabela:', insertError);
                                    }
                                    continue; // Extraiu com IA, vai pro próximo
                                }
                            } catch (aiErr) {
                                console.error(`🤖 Automagic: Falha no Gemini SDK para ${email.sender.email} (rate limit ou erro):`, (aiErr as Error).message);
                            }

                            // 6. FALLBACK: Se falhou a IA ou ela retornou vazio, insere o basico que temos
                            const fallbackSuggestion = {
                                organization_id: orgId,
                                name: email.sender.name,
                                email: email.sender.email,
                                status: 'pending'
                            };

                            const { error: fallbackError } = await bgSupabase
                                .from('contact_suggestions')
                                .upsert([fallbackSuggestion], { onConflict: 'organization_id, email', ignoreDuplicates: true });
                            if (fallbackError) {
                                console.error('🤖 Automagic: Falha ao inserir o fallback na tabela:', fallbackError);
                            }
                        }

                    } catch (bgErr) {
                        console.error('Falha no processo de extração de assinaturas em background:', bgErr);
                    }
                });
            }
        }
        // --- FIM DA AUTOMAÇÃO ---

        // Limpar body enorme antes de mandar pro front-end pra economizar RAM do navegador
        const frontEndEmails = emails.map((e: any) => {
            const { body, ...rest } = e;
            return rest;
        });

        return NextResponse.json({ emails: frontEndEmails });

    } catch (error: any) {
        console.error('Error syncing emails:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
