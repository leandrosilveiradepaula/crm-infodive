import { GoogleGenerativeAI } from '@google/generative-ai';
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
        const { text, image } = await req.json();

        if (!text && !image) {
            return NextResponse.json({ error: 'Text or image is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const promptParts: GeminiPromptPart[] = [];

        if (image) {
            const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                promptParts.push({
                    inlineData: {
                        data: matches[2],
                        mimeType: matches[1]
                    }
                });
                promptParts.push('Analise este documento/imagem de empresa (Cartão CNPJ, Cartão de Visitas, etc).');
            } else {
                return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
            }
        }

        if (text) {
            promptParts.push(`Texto extraído/fornecido:\n"""\n${text}\n"""`);
        }

        promptParts.push(`
        Extraia os dados da empresa em formato JSON estrito.
        Não inclua markdown, apenas o JSON.
        
        Campos requeridos (retorne string vazia "" se não encontrar):
        - name (Razão Social ou Nome Fantasia principal)
        - cnpj (Formato XX.XXX.XXX/0001-XX)
        - ie (Inscrição Estadual)
        - zip (CEP - Formato XXXXX-XXX)
        - street (Logradouro)
        - number (Número)
        - complement (Complemento)
        - neighborhood (Bairro)
        - city (Cidade)
        - state (UF - Sigla)
        - email
        - phone (Telefone principal)
        - website
        
        Exemplo de saída:
        {
            "name": "Empresa Exemplo Ltda",
            "cnpj": "12.345.678/0001-90",
            "ie": "123.456.789.111",
            "zip": "01000-000",
            "street": "Av. Paulista",
            "number": "1000",
            "complement": "Sala 10",
            "neighborhood": "Bela Vista",
            "city": "São Paulo",
            "state": "SP",
            "email": "contato@empresa.com",
            "phone": "(11) 3000-0000",
            "website": "www.empresa.com"
        }
        `);

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const responseText = response.text();

        const jsonString = responseText.replace(/```json\n|\n```/g, '').trim();

        try {
            const data = JSON.parse(jsonString);
            return NextResponse.json({ data });
        } catch {
            console.error('Gemini company response parse failed', {
                operation: 'gemini.company.parse',
                provider: 'gemini',
                status: 'parse_failed',
                errorCode: 'gemini_response_parse_failed',
            });
            return NextResponse.json({ error: 'Falha ao processar resposta da IA' }, { status: 500 });
        }

    } catch (error: unknown) {
        const companyError = error as { code?: string; name?: string; message?: string; status?: number };
        console.error('Gemini company parse failed', {
            operation: 'gemini.company.parse',
            provider: 'gemini',
            status: 'failed',
            errorCode: companyError.code || companyError.name || 'gemini_company_parse_failed',
        });
        
        if (companyError.status === 429 || companyError.message?.includes('429 Too Many Requests') || companyError.message?.includes('Resource exhausted')) {
            return NextResponse.json(
                { error: 'A inteligência artificial está sobrecarregada no momento (limite excedido). Por favor, aguarde alguns instantes e tente novamente.' }, 
                { status: 429 }
            );
        }
        
        return NextResponse.json({ error: 'Erro ao processar dados da empresa' }, { status: 500 });
    }
}
