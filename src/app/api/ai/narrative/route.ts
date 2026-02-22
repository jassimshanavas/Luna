import { NextRequest, NextResponse } from 'next/server';

const MODELS_TO_TRY = [
    { name: 'gemini-flash-latest', version: 'v1beta' },
    { name: 'gemini-2.0-flash', version: 'v1' },
    { name: 'gemini-2.0-flash-lite', version: 'v1' },
];

function buildUrl(name: string, version: string) {
    return `https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent`;
}

export async function POST(req: NextRequest) {
    try {
        const log = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return NextResponse.json({ narrative: null, error: 'API key not configured' }, { status: 503 });
        }

        const prompt = `You are Dr. Luna, a compassionate menstrual health AI. Based on the following daily log data, write a warm, empathetic 2-3 sentence narrative summary of the user's day. Use emojis sparingly. Write in second person ("You felt..."). Be encouraging and kind.

Log data: ${JSON.stringify(log)}

Write ONLY the narrative sentences, no extra preamble or labels. Keep it concise. NEVER mention Gemini or AI in the narrative.`;

        let lastError = '';
        let retryAfter = 0;

        for (const { name, version } of MODELS_TO_TRY) {
            const url = buildUrl(name, version);
            const response = await fetch(`${url}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const narrative = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                return NextResponse.json({ narrative, model: name });
            }

            const errData = await response.json();
            lastError = errData?.error?.message || `HTTP ${response.status}`;

            if (response.status === 429) {
                const retryMatch = lastError.match(/retry in (\d+)/i);
                if (retryMatch) retryAfter = parseInt(retryMatch[1]);
                continue; // Try next model
            }
            if (response.status === 404) continue;
            break;
        }

        if (retryAfter > 0) {
            return NextResponse.json({ narrative: null, error: 'Rate limit reached', retryAfter }, { status: 429 });
        }
        return NextResponse.json({ narrative: null, error: lastError }, { status: 500 });

    } catch (err: any) {
        console.error('Narrative route error:', err);
        return NextResponse.json({ narrative: null, error: err.message }, { status: 500 });
    }
}
