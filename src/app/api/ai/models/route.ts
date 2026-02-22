import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return NextResponse.json({ error: 'No API key set' }, { status: 503 });
    }

    // Try v1beta first (newer models), then v1 (classic)
    const results: any = {};

    for (const version of ['v1beta', 'v1']) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`);
            const data = await res.json();
            results[version] = {
                status: res.status,
                models: data.models?.map((m: any) => ({ name: m.name, displayName: m.displayName, supportedMethods: m.supportedGenerationMethods })) || data.error?.message,
            };
        } catch (e: any) {
            results[version] = { error: e.message };
        }
    }

    return NextResponse.json(results);
}
