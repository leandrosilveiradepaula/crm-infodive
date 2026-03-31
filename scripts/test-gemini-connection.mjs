import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

async function test() {
    console.log("Starting test...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No API key");

    const prompt = `
Você é um Diretor Comercial Sênior experiente.
DATA DE HOJE: 2026-03-30
DEAL: "Projeto X" | Cliente: Acme | Valor: R$ 50000 | Estágio: discovery | Probabilidade: 50% | Dias no estágio: 1 | Contato: N/I | Última atividade: Nunca | ID: uuid-x

Sugira 1 ação:
[
  {
    "dealId": "uuid-do-deal",
    "type": "call",
    "title": "T",
    "description": "D",
    "priority": "high",
    "dueDaysFromNow": 1,
    "reasoning": "R"
  }
]
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    console.log("Calling Gemini...");

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) {
        console.error("HTTP Error", response.status);
        const err = await response.text();
        console.error(err);
        return;
    }
    
    const data = await response.json();
    console.log("Success!");
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

test().catch(console.error);
