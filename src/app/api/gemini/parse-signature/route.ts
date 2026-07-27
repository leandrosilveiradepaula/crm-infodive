import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireSessionContext } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

type GeminiPromptPart = string | {
    inlineData: {
        data: string;
        mimeType: string;
    };
};

export async function POST(req: Request) {
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { signature, image } = await req.json();

        if (!signature && !image) {
            return NextResponse.json({ error: 'Signature text or image is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const promptParts: GeminiPromptPart[] = [];

        if (image) {
            // Image is expected to be a base64 string (data:image/png;base64,...)
            // We need to extract the base64 data and the mime type
            const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                promptParts.push({
                    inlineData: {
                        data: matches[2],
                        mimeType: matches[1]
                    }
                });
                promptParts.push('Analise esta imagem de assinatura/cartão de visitas.');
            }
            // Se image for passada, mas o formato for inválido, ignoramos e continuamos com o texto (se existir)
        }

        if (signature) {
            promptParts.push(`Texto da assinatura ou e-mail:\n"""\n${signature}\n"""`);
        }

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
        
        Exemplo de saída:
        {
            "name": "João Silva",
            "email": "joao@empresa.com",
            "mobile_phone": "(11) 99999-9999",
            "landline_phone": "(11) 3333-3333",
            "whatsapp": "(11) 99999-9999",
            "role": "Gerente de Vendas",
            "company": "Empresa Ltd",
            "address": "Av. Paulista, 1000 - SP",
            "linkedin": "https://linkedin.com/in/joaosilva",
            "website": "empresa.com"
        }
        `);

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const text = response.text();

        // Limpar markdown se houver
        const jsonString = text.replace(/```json\n|\n```/g, '').trim();

        try {
            const data = JSON.parse(jsonString);
            return NextResponse.json({ data });
        } catch {
            console.error('Gemini signature response parse failed', {
                operation: 'gemini.signature.parse',
                provider: 'gemini',
                status: 'parse_failed',
                errorCode: 'gemini_response_parse_failed',
            });
            return NextResponse.json({ error: 'Falha ao processar resposta da IA' }, { status: 500 });
        }

    } catch (error: unknown) {
        const signatureError = error as { code?: string; name?: string; message?: string; status?: number };
        console.error('Gemini signature parse failed', {
            operation: 'gemini.signature.parse',
            provider: 'gemini',
            status: 'failed',
            errorCode: signatureError.code || signatureError.name || 'gemini_signature_parse_failed',
        });
        
        if (signatureError.status === 429 || signatureError.message?.includes('429 Too Many Requests') || signatureError.message?.includes('Resource exhausted')) {
            return NextResponse.json(
                { error: 'A inteligência artificial está sobrecarregada no momento (limite excedido). Por favor, aguarde alguns instantes e tente novamente.' }, 
                { status: 429 }
            );
        }
        
        return NextResponse.json({ error: 'Erro ao processar assinatura' }, { status: 500 });
    }
}
