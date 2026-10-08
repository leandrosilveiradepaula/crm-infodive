import { NextRequest, NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONFIG } from '@/lib/config';
import { refreshMicrosoftToken } from '@/lib/microsoft-auth';
import { consumeRateLimit } from '@/lib/ai-rate-limit';
import { consumeDurableAiQuota } from '@/lib/ai-durable-quota';
import { getRequestId } from '@/lib/request-context';
import { recordOperationalEvent } from '@/lib/operational-events';

// Delay helper to throttle Gemini API calls and avoid rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type GraphMessage = {
    id: string;
    sender: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
    subject: string;
    bodyPreview: string;
    body?: {
        content?: string;
    };
    receivedDateTime: string;
    isRead: boolean;
    categories?: string[];
};

type EmailMessage = {
    id: string;
    sender: {
        name: string;
        email: string;
        avatar: string;
    };
    subject: string;
    preview: string;
    body: string;
    date: string;
    read: boolean;
    labels: string[];
    folder: string;
};

type EmailRow = {
    email: string;
};

// Direct Gemini SDK call — avoids internal HTTP fetch that gets blocked by middleware auth check
async function parseSignatureWithGemini(emailBody: string): Promise<Record<string, unknown> | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[EmailSyncRoute] signature parsing skipped');
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
        return parsed.length > 0 ? parsed[0] as Record<string, unknown> : null;
    }

    return parsed as Record<string, unknown>;
}

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request.headers.get('X-Request-Id'));

    // 1. Auth guard (iron-session)
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        recordOperationalEvent({ area: 'email', operation: 'sync', outcome: 'unauthorized', requestId, durationMs: Date.now() - startedAt, statusCode: 401 });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get provider token from cookie (set during OAuth callback)
    const providerToken = request.cookies.get('crm_provider_token')?.value;

    if (!providerToken) {
        recordOperationalEvent({ area: 'email', operation: 'sync', outcome: 'provider_token_missing', requestId, durationMs: Date.now() - startedAt, statusCode: 401 });
        return NextResponse.json({ error: 'Not authenticated or missing provider token. Please sign in with Office 365.' }, { status: 401 });
    }

    try {

        // Fetch emails from Microsoft Graph API (Requesting full body for signature extraction)
        const fetchUrl = `${CONFIG.API.MS_GRAPH}/me/messages?$top=20&$select=sender,subject,bodyPreview,body,receivedDateTime,isRead,categories&$orderby=receivedDateTime DESC`;
        
        let response = await fetch(fetchUrl, {
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
            }
        });

        let newTokens = null;

        // Auto-refresh if token is expired (401)
        if (response.status === 401) {
            const refreshToken = request.cookies.get('crm_refresh_token')?.value;
            if (refreshToken) {
                console.info('[EmailSyncRoute] token refresh started');
                try {
                    newTokens = await refreshMicrosoftToken(refreshToken);
                    // Retry with new token
                    response = await fetch(fetchUrl, {
                        headers: {
                            'Authorization': `Bearer ${newTokens.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch {
                    console.error('[EmailSyncRoute] token refresh failed');
                    recordOperationalEvent({ area: 'email', operation: 'token_refresh', outcome: 'failure', requestId, durationMs: Date.now() - startedAt, statusCode: 401 });
                    return NextResponse.json({ error: 'Session expired. Please reconnect your Office 365 account.' }, { status: 401 });
                }
            } else {
                recordOperationalEvent({ area: 'email', operation: 'token_refresh', outcome: 'refresh_token_missing', requestId, durationMs: Date.now() - startedAt, statusCode: 401 });
                return NextResponse.json({ error: 'Sessão da Microsoft expirada. Conecte sua conta novamente.' }, { status: 401 });
            }
        }

        if (!response.ok) {
            console.error('[EmailSyncRoute] graph sync failed');
            recordOperationalEvent({ area: 'integration', operation: 'microsoft_graph_sync', outcome: 'failure', requestId, durationMs: Date.now() - startedAt, statusCode: response.status });
            throw new Error('Microsoft Graph sync failed');
        }

        const data = await response.json();
        const emails: EmailMessage[] = data.value.map((msg: GraphMessage) => ({
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
        const aiRateLimit = consumeRateLimit({ scope: 'email-sync-signature-ai', subject: `${organizationId}:${userId}`, limit: 2, windowMs: 60_000 });
        let aiAnalysesRemaining = aiRateLimit.allowed ? 3 : 0;

        if (orgId && emails.length > 0) {
            // 1. Isolar remetentes únicos
            const uniqueSenders = Array.from(new Set(emails.map((e) => e.sender.email).filter(Boolean)));

            if (uniqueSenders.length > 0) {
                recordOperationalEvent({ area: 'email', operation: 'contact_suggestion_background', outcome: 'scheduled', requestId, count: uniqueSenders.length });
                // Dispara logica em background
                Promise.resolve().then(async () => {
                    const backgroundStartedAt = Date.now();
                    let processedCount = 0;
                    try {
                        const bgSupabase = createAdminClient();

                        // 2. Procurar quais remetentes JÁ existem no CRM (Contacts)
                        const { data: existingContacts } = await bgSupabase
                            .from('account_contacts')
                            .select('email')
                            .eq('organization_id', orgId)
                            .in('email', uniqueSenders);

                        // 2.5 Verificar quem está na BLOCKLIST (Ignorados pelo Usuário)
                        const { data: blacklistedContacts } = await bgSupabase
                            .from('contact_blacklists')
                            .select('email')
                            .eq('organization_id', orgId)
                            .in('email', uniqueSenders);

                        const existingEmailsArray = [
                            ...((existingContacts as EmailRow[] | null)?.map((c) => c.email.toLowerCase()) || []),
                            ...((blacklistedContacts as EmailRow[] | null)?.map((c) => c.email.toLowerCase()) || [])
                        ];
                        const existingEmails = new Set(existingEmailsArray);

                        // 3. Filtrar os emails que pertencem a Pessoas Não Cadastradas
                        const unknownEmails = emails.filter((e) => !existingEmails.has(e.sender.email.toLowerCase()));

                        // Mapa para não processar a mesma pessoa duas vezes se ela mandou 3 emails seguidos
                        const processedUnknowns = new Set();

                        for (const email of unknownEmails) {
                            if (processedUnknowns.has(email.sender.email)) continue;
                            processedUnknowns.add(email.sender.email);
                            processedCount += 1;

                            if (!email.body || email.body.length < 20) {
                                continue; // Evita emails vazios
                            }

                            // 4. Chama o SDK do Gemini DIRETAMENTE (sem fetch interno)
                            // Fetch interno seria bloqueado pelo middleware de auth do Next.js

                            // A sincronização continua funcionando mesmo sem orçamento local de IA.
                            // No máximo três assinaturas são analisadas por sincronização; o restante usa fallback básico.
                            if (aiAnalysesRemaining > 0) {
                                const durableQuota = await consumeDurableAiQuota({
                                    organizationId: orgId,
                                    scope: 'email-signature-model-call',
                                    limit: 6,
                                    windowSeconds: 60,
                                });

                                if (durableQuota.allowed) {
                                    aiAnalysesRemaining -= 1;
                                    await sleep(1500);

                                    try {
                                        const contactData = await parseSignatureWithGemini(email.body);

                                        const hasSufficientData = contactData && (
                                            contactData.name ||
                                            contactData.mobile_phone ||
                                            contactData.landline_phone ||
                                            contactData.role ||
                                            contactData.company ||
                                            contactData.email
                                        );

                                        if (hasSufficientData) {
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
                                                console.error('[EmailSyncRoute] contact suggestion insert failed');
                                            }
                                            continue;
                                        }
                                    } catch {
                                        console.error('[EmailSyncRoute] signature parsing failed');
                                    }
                                } else {
                                    aiAnalysesRemaining = 0;
                                }
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
                                console.error('[EmailSyncRoute] fallback contact suggestion insert failed');
                            }
                        }

                        recordOperationalEvent({ area: 'email', operation: 'contact_suggestion_background', outcome: 'success', requestId, durationMs: Date.now() - backgroundStartedAt, count: processedCount });
                    } catch {
                        console.error('[EmailSyncRoute] background signature extraction failed');
                        recordOperationalEvent({ area: 'email', operation: 'contact_suggestion_background', outcome: 'failure', requestId, durationMs: Date.now() - backgroundStartedAt, count: processedCount });
                    }
                });
            }
        }
        // --- FIM DA AUTOMAÇÃO ---

        // Limpar body enorme antes de mandar pro front-end pra economizar RAM do navegador
        const frontEndEmails = emails.map((e) => {
            const rest: Partial<EmailMessage> = { ...e };
            delete rest.body;
            return rest;
        });

        const finalResponse = NextResponse.json({ emails: frontEndEmails });

        // Update cookies if we got new tokens
        if (newTokens) {
            finalResponse.cookies.set('crm_provider_token', newTokens.accessToken, {
                path: '/',
                maxAge: 3600,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            });
            if (newTokens.refreshToken) {
                finalResponse.cookies.set('crm_refresh_token', newTokens.refreshToken, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });
            }
        }

        recordOperationalEvent({ area: 'email', operation: 'sync', outcome: 'success', requestId, durationMs: Date.now() - startedAt, statusCode: 200, count: frontEndEmails.length });
        return finalResponse;

    } catch {
        console.error('[EmailSyncRoute] email sync failed');
        recordOperationalEvent({ area: 'email', operation: 'sync', outcome: 'failure', requestId, durationMs: Date.now() - startedAt, statusCode: 500 });
        return NextResponse.json({ error: 'Não foi possível sincronizar os emails.' }, { status: 500 });
    }
}
