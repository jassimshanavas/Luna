'use client';
import { useState, useRef, useEffect } from 'react';
import { useApp, CyclePhase } from '@/context/AppContext';
import { AVAILABLE_MODELS } from '@/constants/ai-data';

interface Message { role: 'bot' | 'user'; text: string; isError?: boolean; }

const PHASE_MESSAGES: Record<CyclePhase, string[]> = {
    period: [
        "🌹 You're in your menstrual phase. Your body is doing incredible work right now. Rest is productive and necessary.",
        "🩸 Experiencing cramps? Try a heating pad on your lower abdomen + ibuprofen taken with food can make a real difference.",
        "🫀 Your estrogen and progesterone are at their lowest — it's normal to feel more introspective or emotional right now.",
        "🥬 Eat iron-rich foods today: lentils, spinach, red meat or fortified cereals to replenish what you're losing.",
    ],
    follicular: [
        "🌱 Your estrogen is rising! You'll notice increased energy, creativity, and motivation this week.",
        "💪 This is the best time for challenging workouts — your body is primed for strength and performance.",
        "🧠 Estrogen boosts verbal fluency and memory. Great time for presentations, interviews, or creative projects!",
    ],
    ovulation: [
        "🌟 You're ovulating! This is your most fertile window. The egg is released and viable for 12-24 hours.",
        "💕 Your LH is surging. You may feel more confident, social, and attractive right now.",
        "⚡ Peak energy, peak strength, peak everything — this is your power phase. Channel it!",
    ],
    luteal: [
        "🌙 You're in the luteal phase. Progesterone rises here and can make you feel calmer but also more tired.",
        "😴 It's common to need more sleep in the luteal phase — progesterone has a sedative effect.",
        "🍫 Craving dark chocolate? That's your body asking for magnesium, which helps with PMS symptoms!",
    ],
    pms: [
        "🫧 PMS symptoms are caused by fluctuating hormone levels. You're not 'crazy' — it's real and valid.",
        "🧂 Reducing sodium can significantly reduce bloating in the days before your period.",
        "🤗 Your sensitivity is heightened — communicating your needs to loved ones can help reduce distress.",
    ],
    late: [
        "⏰ Periods can be delayed by stress, travel, weight changes, or hormonal shifts.",
        "🧘 Try not to stress — stress itself can further delay your period. Take it one day at a time.",
        "🩺 If your period is more than 7 days late and a pregnancy test is negative, consult your doctor.",
    ],
    unknown: [
        "💗 Welcome to Luna! Start by logging your last period date on the Dashboard to get personalized insights.",
        "📅 Track your period for 2-3 months to see your unique cycle patterns emerge.",
        "💡 The more you log — symptoms, mood, sleep — the more accurate your AI insights will be!",
    ],
};

const QUICK_QUESTIONS = [
    "Why am I so tired right now?",
    "When is my fertile window?",
    "What can I do for cramps?",
    "Is my cycle length normal?",
    "What should I eat this phase?",
    "Why do I feel emotional?",
    "How do I track ovulation?",
    "What causes PMS?",
    "Can stress delay my period?",
    "Normal cycle length?",
];

const PHASE_GRADIENTS: Record<CyclePhase, string> = {
    period: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    follicular: 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)',
    ovulation: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)',
    luteal: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
    pms: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
    late: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    unknown: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #fb923c 100%)',
};

function renderMarkdown(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
}

export default function AIPage() {
    const { state, getCurrentPhase, getCurrentCycleDay, getDaysUntilPeriod, getNextPeriodDate, getDayLog } = useApp();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = getDayLog(todayStr);
    const phase = getCurrentPhase();
    const cycleDay = getCurrentCycleDay();
    const daysUntil = getDaysUntilPeriod();

    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: `Hello ${state.profile.name || 'beautiful'}! 🌸 I'm **Dr. Luna**, your personal cycle companion.\n\nI can answer questions about your cycle, symptoms, hormones, nutrition, and more — all personalized to **where you are in your cycle right now** (you're on Day **${cycleDay}**, ${phase} phase).\n\nWhat would you like to explore today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [activeModel, setActiveModel] = useState('');
    const selectedModel = AVAILABLE_MODELS.find(m => m.name === state.profile.aiModel) || AVAILABLE_MODELS[0];
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const startCountdown = (seconds: number) => {
        setRetryCountdown(seconds);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setRetryCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const sendMessage = async (text?: string) => {
        const q = (text || input).trim();
        if (!q || isLoading) return;
        setInput('');

        const newMessages: Message[] = [...messages, { role: 'user', text: q }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    model: selectedModel,
                    cycleContext: {
                        phase, cycleDay, daysUntilPeriod: daysUntil,
                        avgCycleLength: state.profile.averageCycleLength,
                        avgPeriodLength: state.profile.averagePeriodLength,
                        todayMood: todayLog?.mood || null,
                        todayFlow: todayLog?.flow || null,
                        todaySymptoms: todayLog?.symptoms || [],
                        todaySleep: todayLog?.sleepHours || null,
                        todayWater: todayLog?.waterIntake || null,
                    }
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 503) {
                    setApiKeyMissing(true);
                    setMessages(prev => [...prev, { role: 'bot', text: '⚙️ **Gemini API key not configured.** Please add your API key to `.env.local` and restart the server.\n\nGet your free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)', isError: true }]);
                } else if (res.status === 429) {
                    const wait = data.retryAfter || 60;
                    startCountdown(wait);
                    setMessages(prev => [...prev, { role: 'bot', text: `⏳ **Rate limit reached.** The free tier allows ~15 requests/minute. I'll be ready in **${wait} seconds**!`, isError: true }]);
                } else {
                    setMessages(prev => [...prev, { role: 'bot', text: `❌ **Error:** ${data.error || 'Something went wrong. Please try again.'}`, isError: true }]);
                }
            } else {
                const headModel = res.headers.get('X-AI-Model');
                if (headModel) setActiveModel(headModel);
                setMessages(prev => [...prev, { role: 'bot', text: '' }]);

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let buffer = '';

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        try {
                            const regex = /\"text\":\s*\"((?:[^\"\\]|\\.)*)\"/g;
                            let match;
                            let newText = '';
                            while ((match = regex.exec(buffer)) !== null) {
                                let content = match[1];
                                content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                                newText += content;
                            }
                            if (newText.length > fullText.length) {
                                fullText = newText;
                                setMessages(prev => {
                                    const next = [...prev];
                                    next[next.length - 1].text = fullText;
                                    return next;
                                });
                            }
                        } catch (e) { console.error('Stream parsing error', e); }
                    }
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: '🌐 **Network error.** Please check your connection and try again.', isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const phaseTips = PHASE_MESSAGES[phase] || PHASE_MESSAGES.unknown;
    const phaseGradient = PHASE_GRADIENTS[phase] || PHASE_GRADIENTS.unknown;

    return (
        <div className="animate-fade-in">

            {/* ── API Key Banner ── */}
            {apiKeyMissing && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 18px', borderRadius: '14px', marginBottom: '16px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.35)' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚙️</span>
                    <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <strong>Gemini API key not set.</strong> Add <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: '4px' }}>GEMINI_API_KEY=your_key</code> to <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: '4px' }}>.env.local</code> and restart.
                        {' '}<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style={{ color: 'var(--primary)', fontWeight: 700 }}>Get free key →</a>
                    </div>
                </div>
            )}

            {/* ── Mobile-only status strip ── */}
            <div className="ai-mobile-status">
                <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', marginBottom: '14px' }}>
                    {[
                        { icon: '🗓️', label: `Day ${cycleDay}` },
                        { icon: '🌙', label: phase.charAt(0).toUpperCase() + phase.slice(1) },
                        { icon: '🌹', label: daysUntil !== null ? (daysUntil > 0 ? `Period in ${daysUntil}d` : 'Period today!') : '—' },
                        { icon: '🔄', label: `${state.profile.averageCycleLength}d cycle` },
                    ].map((p, i) => (
                        <div key={i} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.2)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            <span>{p.icon}</span>{p.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main 2-col grid ── */}
            <div className="ai-page-grid">

                {/* ═══ LEFT: Chat ═══ */}
                <div className="ai-chat-column">

                    {/* ── Chat Card ── */}
                    <div className="card ai-chat-card">

                        {/* Chat Header — phase-tinted premium bar */}
                        <div className="ai-chat-header" style={{ background: `linear-gradient(135deg, rgba(236,72,153,0.06), rgba(167,139,250,0.06))` }}>
                            {/* Avatar + pulse */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div className="ai-avatar-icon" style={{
                                    borderRadius: '16px',
                                    background: phaseGradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'breathe 4s ease-in-out infinite',
                                    boxShadow: '0 6px 20px rgba(236,72,153,0.35)',
                                }}>✨</div>
                                <div style={{
                                    position: 'absolute', bottom: '-2px', right: '-2px',
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    background: isLoading ? '#fb923c' : '#34d399',
                                    border: '2px solid var(--bg-card)',
                                    animation: 'pulse 2s infinite',
                                }} />
                            </div>

                            {/* Title + status */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}>
                                    Dr. Luna AI
                                </div>
                                <div style={{ fontSize: '0.75rem', color: isLoading ? '#fb923c' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0, animation: isLoading ? 'pulse 1s infinite' : 'none' }} />
                                    {isLoading ? 'Thinking deeply for you...' : retryCountdown > 0 ? `Ready in ${retryCountdown}s` : 'Online · Personalized to your cycle'}
                                </div>
                            </div>

                            {/* Phase badge + model badge */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                {/* Phase pill — hidden on mobile, shown on desktop */}
                                <div className="ai-header-phase-pill" style={{
                                    padding: '5px 12px', borderRadius: '9999px',
                                    background: phaseGradient,
                                    fontSize: '0.68rem', fontWeight: 700, color: 'white',
                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {phase === 'unknown' ? 'Start Tracking' : `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`}
                                </div>
                                {/* Model badge — always shown */}
                                <div style={{
                                    padding: '5px 10px', borderRadius: '9999px',
                                    background: `${selectedModel.color}18`,
                                    border: `1px solid ${selectedModel.color}40`,
                                    fontSize: '0.62rem', fontWeight: 700, color: selectedModel.color,
                                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                }}>
                                    {selectedModel.tag.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* ── Messages ── */}
                        <div className="ai-chat-messages" id="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                                    {msg.role === 'bot' && (
                                        <div style={{
                                            width: '34px', height: '34px', borderRadius: '10px',
                                            background: phaseGradient,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1rem', flexShrink: 0,
                                            boxShadow: '0 2px 8px rgba(236,72,153,0.2)',
                                        }}>✨</div>
                                    )}
                                    <div
                                        style={{
                                            maxWidth: '78%',
                                            padding: '13px 17px',
                                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                                            background: msg.role === 'user'
                                                ? phaseGradient
                                                : msg.isError
                                                    ? 'rgba(251,146,60,0.08)'
                                                    : 'var(--bg-secondary)',
                                            border: msg.role === 'bot' ? `1px solid ${msg.isError ? 'rgba(251,146,60,0.3)' : 'var(--border)'}` : 'none',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.7,
                                            boxShadow: msg.role === 'user' ? '0 4px 20px rgba(236,72,153,0.28)' : '0 1px 4px rgba(0,0,0,0.04)',
                                            animation: 'ai-msg-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                                    />
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: phaseGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✨</div>
                                    <div style={{ padding: '14px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px 20px 20px 20px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                        {[0, 1, 2].map(dot => (
                                            <div key={dot} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--secondary)', animation: `pulse 1.1s ease-in-out ${dot * 0.22}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Quick Questions scroll strip ── */}
                        <div className="ai-quick-strip">
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '2px' }}>
                                💬 Quick questions
                            </div>
                            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                                {QUICK_QUESTIONS.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        disabled={isLoading}
                                        id={`quick-q-${q.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
                                        style={{
                                            flexShrink: 0, whiteSpace: 'nowrap',
                                            padding: '7px 14px', borderRadius: '9999px',
                                            fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit',
                                            background: 'rgba(244,114,182,0.07)',
                                            border: '1px solid rgba(244,114,182,0.22)',
                                            color: 'var(--primary)', cursor: 'pointer',
                                            opacity: isLoading ? 0.45 : 1,
                                            transition: 'all 0.15s',
                                        }}
                                    >{q}</button>
                                ))}
                            </div>
                        </div>

                        {/* ── Input Bar ── */}
                        <div className="ai-input-bar">
                            {/* Retry countdown banner */}
                            {retryCountdown > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '12px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', marginBottom: '10px', fontSize: '0.8rem', color: '#ea580c' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>⏳</span>
                                    Rate limit — Dr. Luna is recovering. Ready in <strong>{retryCountdown}s</strong>.
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        type="text" value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        className="input"
                                        placeholder="Ask Dr. Luna anything about your cycle..."
                                        id="ai-chat-input"
                                        disabled={isLoading || retryCountdown > 0}
                                        style={{ width: '100%', borderRadius: '16px', fontSize: '0.95rem', height: '52px', paddingRight: '16px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary ai-send-btn"
                                    onClick={() => sendMessage()}
                                    id="ai-send-btn"
                                    disabled={isLoading || !input.trim() || retryCountdown > 0}
                                    style={{
                                        borderRadius: '16px', height: '52px',
                                        fontWeight: 700, fontSize: '0.9rem',
                                        padding: '0 20px', flexShrink: 0,
                                        opacity: (isLoading || !input.trim() || retryCountdown > 0) ? 0.45 : 1,
                                        transition: 'all 0.2s',
                                        background: phaseGradient,
                                        border: 'none',
                                        boxShadow: (!isLoading && input.trim()) ? '0 4px 16px rgba(236,72,153,0.35)' : 'none',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {isLoading ? <span>⏳<span className="ai-send-label"> Thinking</span></span>
                                        : retryCountdown > 0 ? `${retryCountdown}s`
                                            : <span>✈️<span className="ai-send-label"> Send</span></span>}
                                </button>
                            </div>
                            <div className="ai-input-hint" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                                Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.65rem' }}>Enter</kbd> to send · Powered by {selectedModel.label}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="ai-right-panel">

                    {/* ── Context Card — phase-tinted hero ── */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Phase header strip */}
                        <div style={{ background: phaseGradient, padding: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700, marginBottom: '6px' }}>Your Context</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Playfair Display', serif", marginBottom: '2px' }}>Day {cycleDay}</div>
                            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                                {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                                {daysUntil !== null && daysUntil > 0 ? ` · Period in ${daysUntil}d` : daysUntil === 0 ? ' · Period today!' : ''}
                            </div>
                        </div>

                        {/* Stats list */}
                        <div style={{ padding: '16px' }}>
                            {[
                                { label: 'Cycle Day', value: cycleDay.toString(), icon: '🗓️' },
                                { label: 'Phase', value: phase.charAt(0).toUpperCase() + phase.slice(1), icon: '🌙' },
                                { label: 'Days Until Period', value: daysUntil !== null ? (daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today!' : 'In progress') : '—', icon: '🌹' },
                                { label: 'Cycle Length', value: `${state.profile.averageCycleLength} days`, icon: '🔄' },
                                { label: 'Next Period', value: getNextPeriodDate()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '—', icon: '🔮' },
                            ].map((item, i, arr) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{ display: 'flex', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {item.icon} {item.label}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{item.value}</span>
                                </div>
                            ))}
                            {todayLog && (
                                <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(236,72,153,0.06)', borderRadius: '10px', border: '1px solid rgba(236,72,153,0.15)', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    📋 <strong>Today&apos;s log shared</strong> — mood, flow &amp; symptoms included in context.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Phase Insights ── */}
                    <div className="card">
                        <div className="section-title" style={{ marginBottom: '12px' }}>
                            <span className="section-title-icon">💡</span>
                            {phase.charAt(0).toUpperCase() + phase.slice(1)} Insights
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {phaseTips.slice(0, 3).map((tip, i) => (
                                <div key={i} style={{
                                    padding: '11px 13px',
                                    background: 'rgba(167,139,250,0.06)',
                                    borderRadius: '10px', border: '1px solid rgba(167,139,250,0.18)',
                                    fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55,
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                    onClick={() => sendMessage(tip.replace(/^[^\s]+\s/, ''))}
                                    title="Click to ask Dr. Luna about this"
                                >
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Capabilities (compact list) ── */}
                    <div className="card">
                        <div className="section-title" style={{ marginBottom: '12px' }}>
                            <span className="section-title-icon">🤖</span>
                            I can help with
                        </div>
                        <div className="ai-caps-grid" style={{ gap: '6px' }}>
                            {[
                                ['🩸', 'Cycle & period'],
                                ['😣', 'Symptoms'],
                                ['🌿', 'Fertility'],
                                ['🥗', 'Nutrition'],
                                ['💊', 'PMS relief'],
                                ['😴', 'Sleep & energy'],
                                ['🧘', 'Stress & hormones'],
                                ['👶', 'TTC guidance'],
                            ].map(([icon, label], i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.1)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ fontSize: '0.9rem' }}>{icon}</span>{label}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(251,146,60,0.06)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, border: '1px solid rgba(251,146,60,0.15)' }}>
                            ⚠️ Dr. Luna provides educational information only. Always consult a healthcare professional for medical concerns.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
