'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

function ChecklistItem({ icon, task }: { icon: string; task: string }) {
    const [checked, setChecked] = useState(false);
    return (
        <div onClick={() => setChecked(c => !c)} style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
            background: checked ? 'rgba(52,211,153,0.1)' : 'var(--bg-overlay)',
            border: `1.5px solid ${checked ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
            transition: 'var(--transition)',
        }}>
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            <span style={{ fontSize: '0.88rem', color: checked ? '#059669' : 'var(--text-secondary)', textDecoration: checked ? 'line-through' : 'none', flex: 1, fontWeight: 500 }}>{task}</span>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: checked ? '#34d399' : 'transparent', border: `2.5px solid ${checked ? '#34d399' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {checked && <span style={{ color: 'white', fontSize: '12px', fontWeight: 900 }}>✓</span>}
            </div>
        </div>
    );
}

const EXERCISE_TYPES = [
    'Yoga', 'Walking', 'Running', 'Cycling', 'Swimming', 'HIIT', 'Strength',
    'Pilates', 'Dance', 'Stretch', 'Meditation', 'Rest Day'
];

const WELLNESS_TIPS = {
    period: [
        { icon: '🛁', tip: 'A warm bath with Epsom salts eases cramps and relaxes muscles.' },
        { icon: '🍵', tip: 'Ginger or chamomile tea can reduce inflammation and calm nausea.' },
        { icon: '🌡️', tip: 'A heating pad on your lower abdomen provides fast cramp relief.' },
        { icon: '🥬', tip: 'Eat iron-rich foods: spinach, lentils, red meat to replenish lost iron.' },
    ],
    follicular: [
        { icon: '🏋️', tip: 'This is your strongest phase — perfect for HIIT and strength training.' },
        { icon: '🥚', tip: 'Protein-rich foods support follicle development.' },
        { icon: '💡', tip: 'Start new projects! Estrogen boosts creativity and motivation.' },
        { icon: '🌱', tip: 'Try fermented foods to support your gut during this phase.' },
    ],
    ovulation: [
        { icon: '⚡', tip: 'You\'re at peak energy — challenge yourself with intense workouts!' },
        { icon: '🫐', tip: 'Antioxidant-rich berries support healthy ovulation.' },
        { icon: '💬', tip: 'Great time for important conversations — you\'re most persuasive now.' },
        { icon: '🌻', tip: 'Zinc-rich foods like pumpkin seeds support luteinizing hormone.' },
    ],
    luteal: [
        { icon: '🧘', tip: 'Shift to calmer exercises — yoga and pilates work beautifully.' },
        { icon: '🍫', tip: 'Dark chocolate (70%+) provides magnesium that reduces PMS symptoms.' },
        { icon: '📓', tip: 'Journaling helps process emotions during this reflective phase.' },
        { icon: '😴', tip: 'Prioritize 8+ hours of sleep — progesterone makes you need more rest.' },
    ],
    pms: [
        { icon: '💊', tip: 'Magnesium supplements (200-400mg) significantly reduce PMS symptoms.' },
        { icon: '🧂', tip: 'Reduce salt intake to prevent water retention and bloating.' },
        { icon: '☕', tip: 'Cut caffeine — it amplifies anxiety and breast tenderness.' },
        { icon: '🤗', tip: 'Ask for emotional support. You don\'t have to white-knuckle it alone.' },
    ],
    late: [
        { icon: '⏰', tip: 'Stress can delay periods. Prioritize relaxation and gentle movement today.' },
        { icon: '🧪', tip: 'If you\'re TTC and more than 2-3 days late, a test might be helpful.' },
        { icon: '🛁', tip: 'Warm baths can help lower cortisol and encourage period flow.' },
        { icon: '💆', tip: 'Focus on magnesium-rich foods to help soothe "late-phase" tension.' },
    ],
    unknown: [
        { icon: '📅', tip: 'Start by logging your last period to get personalized tips.' },
        { icon: '💧', tip: 'Drink 8 glasses of water daily for overall hormonal health.' },
        { icon: '🥗', tip: 'A balanced diet rich in whole foods supports cycle regularity.' },
    ],
};

const JOURNAL_PROMPTS = [
    'What is your body asking for today?',
    'How has your energy shifted this week?',
    'How are you feeling right now?',
    'What is one thing you can do to nourish yourself?',
    'How did your sleep affect your mood?',
    'What patterns have you noticed in your cycle?',
    'What would feel supportive for you this phase?',
];

export default function WellnessPage() {
    const { state, getCurrentPhase, showToast, dispatch } = useApp();
    const [activeTab, setActiveTab] = useState<'hub' | 'journal' | 'meditation' | 'nutrition'>('hub');
    const [journalEntry, setJournalEntry] = useState('');
    const [journalSaved, setJournalSaved] = useState(false);
    const [todayExercise, setTodayExercise] = useState<string[]>([]);
    const [meditationMin, setMeditationMin] = useState(5);
    const [meditationRunning, setMeditationRunning] = useState(false);
    const [meditationSec, setMeditationSec] = useState(0);
    const [randomPrompt] = useState(() => JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);

    const phase = getCurrentPhase();
    const tips = (WELLNESS_TIPS as any)[phase] || WELLNESS_TIPS.unknown;
    const today = new Date().toISOString().split('T')[0];
    const logs30 = state.logs.slice(-30);

    // Stats calculations
    const avgSleep = logs30.filter(l => l.sleepHours).length > 0 ? logs30.filter(l => l.sleepHours).reduce((a, b) => a + (b.sleepHours || 0), 0) / logs30.filter(l => l.sleepHours).length : 0;
    const avgWater = logs30.filter(l => l.waterIntake).length > 0 ? logs30.filter(l => l.waterIntake).reduce((a, b) => a + (b.waterIntake || 0), 0) / logs30.filter(l => l.waterIntake).length : 0;
    const avgEnergy = logs30.filter(l => l.energyLevel).length > 0 ? logs30.filter(l => l.energyLevel).reduce((a, b) => a + (b.energyLevel || 0), 0) / logs30.filter(l => l.energyLevel).length : 0;
    const avgSleepQ = logs30.filter(l => l.sleepQuality).length > 0 ? logs30.filter(l => l.sleepQuality).reduce((a, b) => a + (b.sleepQuality || 0), 0) / logs30.filter(l => l.sleepQuality).length : 0;

    const handleSaveJournal = () => {
        if (!journalEntry.trim()) { showToast('Write something first! 💕', 'info'); return; }
        const existing = state.logs.find(l => l.date === today);
        if (existing) {
            dispatch({ type: 'UPDATE_LOG', payload: { date: today, data: { notes: (existing.notes ? existing.notes + '\n' : '') + `[Journal] ${journalEntry}` } } });
        } else {
            dispatch({ type: 'LOG_DAY', payload: { date: today, symptoms: [], notes: `[Journal] ${journalEntry}` } });
        }
        setJournalSaved(true);
        showToast('Journal entry saved 💗', 'success');
    };

    const TABS = [
        { key: 'hub' as const, label: 'Wellness Hub', icon: '💫' },
        { key: 'journal' as const, label: 'Daily Journal', icon: '📓' },
        { key: 'meditation' as const, label: 'Meditation', icon: '🧘' },
        { key: 'nutrition' as const, label: 'Nutrition', icon: '🥗' },
    ];

    const NUTRITION_GUIDE: Record<string, { eat: string[]; avoid: string[]; color: string }> = {
        period: {
            eat: ['Spinach & leafy greens', 'Lentils (iron)', 'Ginger tea', 'Dark chocolate', 'Turmeric', 'Warm soups'],
            avoid: ['Caffeine', 'Alcohol', 'Salty foods', 'Refined sugars'],
            color: '#f472b6',
        },
        follicular: {
            eat: ['Eggs & lean protein', 'Fermented foods', 'Flaxseeds', 'Fresh fruits', 'Quinoa & whole grains'],
            avoid: ['Excessive alcohol', 'Processed foods'],
            color: '#34d399',
        },
        ovulation: {
            eat: ['Berries', 'Almonds (zinc)', 'Pumpkin seeds', 'Asparagus', 'Citrus fruits', 'Salmon'],
            avoid: ['Soy overload', 'Excessive carbs'],
            color: '#fb923c',
        },
        luteal: {
            eat: ['Dark chocolate 70%+', 'Salmon', 'Sweet potato', 'Chickpeas', 'Avocado', 'Chamomile tea'],
            avoid: ['Caffeine (anxiety)', 'Excessive Salt', 'Alcohol'],
            color: '#a78bfa',
        },
        pms: {
            eat: ['Dark leafy greens', 'B6 foods (chickpeas)', 'Complex carbs (oats)', 'Herbal teas'],
            avoid: ['Caffeine', 'Salt', 'Simple sugars'],
            color: '#c084fc',
        },
        late: {
            eat: ['Complex carbohydrates', 'Warm balancing foods', 'Magnesium-rich greens', 'Herbal teas'],
            avoid: ['Caffeine (stress)', 'Salt (bloating)', 'Alcohol'],
            color: '#fb923c',
        },
        unknown: {
            eat: ['Whole grains', 'Lean protein', 'Colorful vegetables', 'Healthy fats'],
            avoid: ['Ultra-processed foods', 'Excessive sugar'],
            color: '#f472b6',
        },
    };

    const nutrition = NUTRITION_GUIDE[phase] || NUTRITION_GUIDE.unknown;


    return (
        <div className="animate-fade-in">
            {/* Tab Navigation: Horizontal Scroll on Mobile */}
            <div className="insights-tabs" style={{ marginBottom: '24px', padding: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className="btn btn-sm insights-tab-btn"
                        style={{
                            flex: '1 0 auto',
                            background: activeTab === t.key ? 'var(--grad-rose)' : 'transparent',
                            color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                        }}
                    >
                        <span>{t.icon}</span>
                        <span className={activeTab === t.key ? '' : 'insights-tab-label'}>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Wellness Hub ── */}
            {activeTab === 'hub' && (
                <div>
                    {/* Stats Grid: 2×2 on Mobile */}
                    <div className="insights-stats-grid stagger-children" style={{ marginBottom: '24px' }}>
                        {[
                            { icon: '😴', label: 'Sleep', value: avgSleep > 0 ? `${avgSleep.toFixed(1)}h` : '—', good: avgSleep >= 7, color: '#a78bfa' },
                            { icon: '💧', label: 'Water', value: avgWater > 0 ? `${avgWater.toFixed(1)} gl` : '—', good: avgWater >= 7, color: '#60a5fa' },
                            { icon: '⚡', label: 'Energy', value: avgEnergy > 0 ? `${avgEnergy.toFixed(1)}/5` : '—', good: avgEnergy >= 3.5, color: '#fb923c' },
                            { icon: '✨', label: 'Quality', value: avgSleepQ > 0 ? `${avgSleepQ.toFixed(1)}/5` : '—', good: avgSleepQ >= 3.5, color: '#34d399' },
                        ].map((s, i) => (
                            <div key={i} className="card card-sm animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                                <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.label}</div>
                                <div style={{ fontSize: '0.7rem', color: s.value !== '—' ? (s.good ? '#34d399' : '#fb923c') : 'var(--text-light)' }}>
                                    {s.value !== '—' ? (s.good ? '✓ Optimized' : 'Needs attention') : 'Start logging'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phase Tips: 2-col to 1-col */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="section-title" style={{ marginBottom: '16px' }}>
                            <span className="section-title-icon">💡</span>
                            Daily Support: {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                        </div>
                        <div className="grid-2">
                            {tips.map((tip: { icon: string; tip: string }, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px', background: 'rgba(244,114,182,0.06)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{tip.icon}</span>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{tip.tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Checklist */}
                    <div className="card">
                        <div className="section-title" style={{ marginBottom: '16px' }}>
                            <span className="section-title-icon">🌸</span>
                            Self-Care Rituals
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { icon: '💧', task: 'Hydrate with 8 glasses of water' },
                                { icon: '🥗', task: 'Eat a phase-synced nourishing meal' },
                                { icon: '🏃', task: 'Gentle movement for 15+ mins' },
                                { icon: '😴', task: 'Aim for 8 hours restful sleep' },
                                { icon: '🧘', task: 'Take 5 minutes for deep breathing' },
                            ].map((item, i) => (
                                <ChecklistItem key={i} icon={item.icon} task={item.task} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Journal ── */}
            {activeTab === 'journal' && (
                <div className="animate-fade-in">
                    <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(167,139,250,0.08) 100%)', border: '1px solid rgba(244,114,182,0.15)' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Daily Reflection ✨</div>
                        <div style={{ fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>&quot;{randomPrompt}&quot;</div>
                    </div>

                    <div className="card">
                        <textarea
                            value={journalEntry}
                            onChange={e => { setJournalEntry(e.target.value); setJournalSaved(false); }}
                            className="input"
                            rows={12}
                            placeholder="Write your heart out here... ♡"
                            style={{ resize: 'vertical', width: '100%', padding: '18px', borderRadius: '16px', fontSize: '0.95rem', lineHeight: 1.7 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{journalEntry.length} characters</span>
                            <button className="btn btn-primary" onClick={handleSaveJournal} style={{ padding: '10px 24px', borderRadius: '12px' }}>
                                {journalSaved ? '✅ Entry Saved' : '💾 Save Journal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Meditation ── */}
            {activeTab === 'meditation' && (
                <div className="animate-fade-in">
                    <div className="card" style={{ textAlign: 'center', marginBottom: '20px', padding: '32px 20px' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px' }}>Mindful Breathing</div>

                        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="220" height="220" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                                <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(244,114,182,0.1)" strokeWidth="10" />
                                <circle cx="110" cy="110" r="100" fill="none" stroke="var(--primary)" strokeWidth="10"
                                    strokeDasharray={`${2 * Math.PI * 100}`}
                                    strokeDashoffset={`${2 * Math.PI * 100 * (1 - meditationSec / (meditationMin * 60))}`}
                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                            </svg>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{Math.floor((meditationMin * 60 - meditationSec) / 60).toString().padStart(2, '0')}:{((meditationMin * 60 - meditationSec) % 60).toString().padStart(2, '0')}</div>
                                {meditationRunning && <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginTop: '8px', animation: 'pulse 2s infinite' }}>{meditationSec % 8 < 4 ? 'Breathe in...' : 'Exhale slowly...'}</div>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                            {[3, 5, 10, 15].map(m => (
                                <button key={m} onClick={() => { if (!meditationRunning) { setMeditationMin(m); setMeditationSec(0); } }}
                                    className="btn btn-sm" style={{ minWidth: '50px', background: meditationMin === m ? 'var(--grad-rose)' : 'var(--bg-secondary)', color: meditationMin === m ? 'white' : 'var(--text-secondary)' }}>{m}m</button>
                            ))}
                        </div>

                        <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: '240px', height: '56px', borderRadius: '16px', fontSize: '1.1rem' }}
                            onClick={() => {
                                if (meditationRunning) { setMeditationRunning(false); }
                                else {
                                    setMeditationSec(0); setMeditationRunning(true);
                                    const interval = setInterval(() => { setMeditationSec(s => { if (s >= meditationMin * 60) { clearInterval(interval); setMeditationRunning(false); return 0; } return s + 1; }); }, 1000);
                                }
                            }}
                        >
                            {meditationRunning ? '⏸ Pause Practice' : '▶ Start Session'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Nutrition ── */}
            {activeTab === 'nutrition' && (
                <div className="animate-fade-in">
                    <div className="card" style={{ marginBottom: '20px', background: `linear-gradient(135deg, ${nutrition.color}15, transparent)`, border: `1.5px solid ${nutrition.color}33` }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '2.4rem' }}>🥗</span>
                            <div>
                                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase Fuel</h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Optimize your cycle with hormonal nutrition</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="card" style={{ borderLeft: '4px solid #34d399' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase' }}>✦ Beneficial Foods</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {nutrition.eat.map((f, i) => <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}><span style={{ color: '#34d399' }}>✓</span> {f}</div>)}
                            </div>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid #f87171' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase' }}>✕ Limit Intake</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {nutrition.avoid.map((f, i) => <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}><span style={{ color: '#f87171' }}>✕</span> {f}</div>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
