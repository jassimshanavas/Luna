import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_MODELS = [
    { name: 'gemini-flash-latest', version: 'v1beta' },
    { name: 'gemini-2.0-flash', version: 'v1' },
    { name: 'gemini-2.0-flash-lite', version: 'v1' },
];

function buildUrl(name: string, version: string) {
    // API uses :streamGenerateContent for streaming
    return `https://generativelanguage.googleapis.com/${version}/models/${name}:streamGenerateContent`;
}

export async function POST(req: NextRequest) {
    try {
        const { messages, cycleContext, model: requestedModel } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return NextResponse.json(
                { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env.local' },
                { status: 503 }
            );
        }

        const systemPrompt = `You are Dr. Luna, a compassionate, knowledgeable, and empathetic AI menstrual health companion built into the Luna app. You specialize in:
- Menstrual cycle education and tracking
- Hormonal health and PMS/PMDD
- Fertility awareness and ovulation tracking
- Period symptoms, pain management, and relief
- Nutrition and lifestyle advice synced to cycle phases
- Emotional support and mental health related to hormonal changes
- Trying to conceive (TTC) guidance

Current user cycle context:
- Cycle Phase: ${cycleContext.phase || 'unknown'}
- Cycle Day: ${cycleContext.cycleDay || 'N/A'}
- Days until next period: ${cycleContext.daysUntilPeriod ?? 'unknown'}
- Average cycle length: ${cycleContext.avgCycleLength || 28} days
- Average period length: ${cycleContext.avgPeriodLength || 5} days
- Today's logged mood: ${cycleContext.todayMood || 'not logged'}
- Today's logged flow: ${cycleContext.todayFlow || 'not logged'}
- Today's logged symptoms: ${cycleContext.todaySymptoms?.join(', ') || 'none'}
- Sleep hours (today): ${cycleContext.todaySleep || 'not logged'}
- Water intake (today): ${cycleContext.todayWater || 'not logged'}

Style guidelines:
- Be warm, supportive, and non-judgmental
- Use gentle, encouraging language with occasional relevant emojis (not excessive)
- Give evidence-based, medically accurate information
- Always remind users to see a doctor for serious or persistent symptoms
- Format responses with **bold text** for key terms, and use clear paragraphs
- Keep responses concise but thorough — typically 150-300 words
- Personalize responses using the cycle context above when relevant
- NEVER diagnose medical conditions, but DO explain possible causes
- NEVER refer to yourself as Gemini, an AI model, or an LLM. You are ALWAYS Dr. Luna.
- Refer users to Luna app features (Calendar, Log, Wellness Hub) when relevant`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: `Understood! I am Dr. Luna, your compassionate menstrual health companion. I have your cycle context and am ready to provide personalized, evidence-based support. How can I help you today? 🌸` }] },
            ...messages.slice(1).map((msg: { role: string; text: string }) => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }],
            })),
        ];

        // Build the ordered list of models to try
        const modelsToTry: { url: string; name: string }[] = requestedModel
            ? [{ url: buildUrl(requestedModel.name, requestedModel.version), name: requestedModel.name }]
            : DEFAULT_MODELS.map(m => ({ url: buildUrl(m.name, m.version), name: m.name }));

        // Try each model in order until one works
        let lastError = '';
        let retryAfter = 0;

        for (const { url, name } of modelsToTry) {
            const response = await fetch(`${url}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 1024,
                        topP: 0.9,
                    },
                }),
            });

            if (response.ok) {
                // Return the stream directly with model name in header for client to read
                return new Response(response.body, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'X-AI-Model': name
                    }
                });
            }

            const errData = await response.json().catch(() => ({}));
            lastError = errData?.error?.message || `HTTP ${response.status}`;

            const retryMatch = lastError.match(/retry in (\d+)/i);
            if (retryMatch) retryAfter = parseInt(retryMatch[1]);

            if (response.status === 404 || response.status === 429) continue;
            break;
        }

        if (retryAfter > 0) {
            return NextResponse.json({ error: `Rate limited. Retry in ${retryAfter}s`, retryAfter }, { status: 429 });
        }
        return NextResponse.json({ error: lastError }, { status: 500 });

    } catch (err: any) {
        console.error('Chat route error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
