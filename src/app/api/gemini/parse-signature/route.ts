import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireSessionContext } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const { signature, image } = await req.json();

        if (!signature && !image) {
            return NextResponse.json({ error: 'Signature text or image is required' }, { status: 400 });
        }
        if ((signature && (typeof signature !== 'string' || signature.length > 20_000)) ||
            (image && (typeof image !== 'string' || image.length > 8_000_000))) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const promptParts: any[] = [];

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
            console.error('[GeminiParseSignatureRoute] signature response parse failed');
            return NextResponse.json({ error: 'Falha ao processar resposta da IA' }, { status: 500 });
        }

    } catch {
        console.error('[GeminiParseSignatureRoute] signature parse failed');

        return NextResponse.json({ error: 'Erro ao processar assinatura' }, { status: 500 });
    }
}
