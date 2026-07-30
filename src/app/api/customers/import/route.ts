import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { organizationId } = await requireSessionContext();
        const { fileName, fileContent, contentType } = await req.json();

        if (!fileContent) {
            return NextResponse.json({ error: 'Conteúdo do arquivo é obrigatório' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
        Você é um especialista em análise de dados de CRM. 
        Recebi um arquivo de importação de clientes (${fileName}) no formato ${contentType}.
        
        Conteúdo do arquivo (primeiras linhas/amostra):
        """
        ${fileContent}
        """

        Sua tarefa é analisar o cabeçalho e o conteúdo para mapear as colunas para o esquema do nosso CRM.
        Identifique os seguintes campos para cada linha:
        - name (Razão Social/Nome da Empresa) - OBRIGATÓRIO
        - cnpj (CNPJ da empresa) - OBRIGATÓRIO (tente extrair apenas números ou formatado)
        - ie (Inscrição Estadual)
        - segment (Segmento de atuação)
        - zip (CEP)
        - street (Rua/Logradouro)
        - number (Número)
        - complement (Complemento)
        - neighborhood (Bairro)
        - city (Cidade)
        - state (UF)
        - relationship_type (Cliente, Fornecedor, Parceiro, etc. Se não identificado, use 'Cliente')
        
        CONTATOS (as colunas podem estar misturadas):
        Cada empresa pode ter um ou mais contatos. Procure por:
        - contact_name (Nome do contato)
        - contact_email (Email do contato)
        - contact_mobile (Celular do contato)
        - contact_role (Cargo)

        Retorne um objeto JSON com a seguinte estrutura:
        {
            "mappedData": [
                {
                    "name": "...",
                    "cnpj": "...",
                    "ie": "...",
                    "segment": "...",
                    "zip": "...",
                    "street": "...",
                    "number": "...",
                    "complement": "...",
                    "neighborhood": "...",
                    "city": "...",
                    "state": "...",
                    "relationship_type": "...",
                    "contacts": [
                        {
                            "name": "...",
                            "email": "...",
                            "mobile_phone": "...",
                            "role": "...",
                            "is_primary": true
                        }
                    ]
                }
            ],
            "stats": {
                "totalDetected": 0,
                "confidenceScore": 0.95
            }
        }

        REGRAS CRÍTICAS:
        1. Se houver múltiplas pessoas na mesma linha, crie múltiplos contatos para a mesma empresa.
        2. Normalize os nomes de cidades e estados.
        3. Se não houver CNPJ, ignore a linha ou tente extrair o máximo possível, mas o CNPJ é a chave de unificação.
        4. Retorne APENAS o JSON, sem markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch {
            console.error('[CustomersImportRoute] customer import response parse failed');
            return NextResponse.json({ error: 'Falha ao processar os dados com IA' }, { status: 500 });
        }

    } catch {
        console.error('[CustomersImportRoute] customer import failed');
        return NextResponse.json({ error: 'Erro ao importar clientes' }, { status: 500 });
    }
}
