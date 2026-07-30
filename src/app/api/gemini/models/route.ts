import { requireSessionContext } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

export async function GET(request: Request) {
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        // Use REST API directly since SDK list() returns empty or behaves differently
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.models || [];

        // Filter only models that support generateContent
        const contentModels = models.filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent')
        );

        const modelList = contentModels.map((m: any) => ({
            name: m.name,
            displayName: m.displayName,
            description: m.description,
            supportedGenerationMethods: m.supportedGenerationMethods,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit
        }));

        return NextResponse.json({
            total: modelList.length,
            allModels: models.length,
            models: modelList
        });

    } catch (e: any) {
        console.error('[GeminiModelsRoute] models list failed');
        return NextResponse.json({ error: e.message || 'Erro ao listar modelos' }, { status: 500 });
    }
}
