'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

function TrimesterCheckItem({ item }: { item: string }) {
    const [checked, setChecked] = useState(false);
    return (
        <div onClick={() => setChecked(c => !c)}
            style={{
                display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer',
                padding: '8px 10px', borderRadius: '8px',
                background: checked ? 'rgba(52,211,153,0.08)' : 'transparent',
            }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0, border: `2px solid ${checked ? '#34d399' : 'var(--border-strong)'}`, background: checked ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {checked && <span style={{ color: 'white', fontSize: '9px', fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: '0.83rem', color: checked ? '#059669' : 'var(--text-secondary)', textDecoration: checked ? 'line-through' : 'none' }}>{item}</span>
        </div>
    );
}

const WEEK_INFO = Array.from({ length: 40 }, (_, i) => {
    const week = i + 1;
    const trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3;
    const sizes = [
        'Poppy seed', 'Sesame seed', 'Pea', 'Blueberry', 'Raspberry', 'Cherry',
        'Strawberry', 'Kidney bean', 'Grape', 'Kumquat', 'Fig', 'Lime',
        'Lemon', 'Peach', 'Apple', 'Avocado', 'Pear', 'Bell pepper',
        'Turnip', 'Banana', 'Carrot', 'Mango', 'Ear of corn', 'Grapefruit',
        'Cauliflower', 'Scallion bunch', 'Lettuce head', 'Eggplant', 'Butternut squash', 'Cabbage',
        'Coconut', 'Jicama', 'Pineapple', 'Cantaloupe', 'Honey dew melon', 'Romaine lettuce',
        'Swiss chard', 'Leek', 'Mini watermelon', 'Watermelon',
    ];
    const milestones = [
        'Implantation happening', 'HPT may be positive', 'Heart begins beating!', 'Major organs forming',
        'Embryo becomes fetus', 'Fingers and toes forming', 'Baby can move!', 'Eyelids forming',
        'Genitals distinguishable', 'Moves start (you may not feel yet)', 'Now the size of a peach',
        'Able to suck thumb', 'First real kicks soon', 'Baby is growing fast',
        'Can hear sounds!', 'Eyes can detect light', 'Rapid brain development', 'Bones hardening',
        'Hearing muffled sounds', 'First smiles in utero', 'Responding to voices',
        'Eyebrows & eyelashes!', 'Can hiccup!', 'Lungs developing',
        'Survival outside womb possible (25+)', 'Fingernails forming',
        'Blinking & dreaming', 'Eyes open & close', 'Practicing breathing',
        'Fat layers building', 'Head down (hopefully!)',
        'Lanugo shedding', 'Nails reach fingertips', 'Drop into pelvis',
        'Immune system boosting', 'Lungs nearly mature', 'Full term soon!',
        'Fully mature', 'Still growing & ready', 'Due date week! 🎉',
    ];
    return { week, trimester, size: sizes[i] || 'Watermelon', milestone: milestones[i] || 'Growing strong! 💕' };
});

const PREGNANCY_SYMPTOMS = [
    'Morning sickness', 'Fatigue', 'Breast tenderness', 'Food cravings', 'Food aversions',
    'Frequent urination', 'Mood swings', 'Constipation', 'Heartburn', 'Back pain',
    'Swollen ankles', 'Shortness of breath', 'Insomnia', 'Stretch marks', 'Braxton Hicks',
    'Round ligament pain', 'Pelvic pressure', 'Increased appetite',
];

const TRIMESTER_CHECKLISTS = {
    1: [
        'Schedule first prenatal appointment',
        'Start prenatal vitamins (folic acid!)',
        'Stop alcohol, smoking, raw fish',
        'Tell your OB about all medications',
        'First trimester genetic screening',
        'Announce pregnancy (when ready)',
    ],
    2: [
        'Anatomy ultrasound (weeks 18-22)',
        'Start planning nursery',
        'Begin prenatal classes',
        'Glucose screening test',
        'Consider babymoon travel',
        'Register for baby gifts',
    ],
    3: [
        'Hospital tour',
        'Pack hospital bag',
        'Install car seat',
        'Finalize birth plan',
        'Stock up on postpartum supplies',
        'Set up pediatrician',
    ],
};

export default function PregnancyPage() {
    const { showToast } = useApp();

    // Pregnancy-specific LMP — completely independent of period tracking data
    const [lmpDate, setLmpDate] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [activeSection, setActiveSection] = useState<'tracker' | 'timeline' | 'symptoms' | 'checklist'>('tracker');

    // Auto-calculate everything as soon as lmpDate changes — no button press needed
    const { currentWeek, dueDate, daysPregnant, progressPct } = useMemo(() => {
        if (!lmpDate) return { currentWeek: null, dueDate: null, daysPregnant: 0, progressPct: 0 };
        const lmp = new Date(lmpDate + 'T00:00:00');
        const today = new Date();
        const days = Math.floor((today.getTime() - lmp.getTime()) / 86400000);
        const week = Math.max(1, Math.min(40, Math.floor(days / 7)));
        const due = new Date(lmp.getTime() + 280 * 86400000);
        return {
            currentWeek: week,
            dueDate: due,
            daysPregnant: Math.max(0, days),
            progressPct: (week / 40) * 100,
        };
    }, [lmpDate]);

    const weekInfo = currentWeek ? WEEK_INFO[currentWeek - 1] : null;
    const trimester = weekInfo?.trimester as 1 | 2 | 3 | undefined;

    const TABS = [
        { key: 'tracker' as const, label: '🤰 Tracker' },
        { key: 'timeline' as const, label: '📅 Timeline' },
        { key: 'symptoms' as const, label: '🩺 Symptoms' },
        { key: 'checklist' as const, label: '✅ Checklist' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Hero */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(251,146,60,0.08) 100%)',
                borderColor: 'rgba(244,114,182,0.2)',
                marginBottom: '24px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
                    <div className="animate-float" style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'var(--grad-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem',
                        boxShadow: '0 12px 32px rgba(236,72,153,0.25)',
                        flexShrink: 0
                    }}>🤰</div>
                    <div style={{ flex: '1 1 300px' }}>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>Pregnancy Journey</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto' }}>
                            Your sanctuary for tracking development, managing symptoms, and preparing for your new arrival.
                        </p>
                    </div>

                    {/* LMP picker */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '16px 20px',
                        width: '100%',
                        maxWidth: '280px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                            📅 Last Period Start (LMP)
                        </label>
                        <input
                            type="date"
                            value={lmpDate}
                            onChange={e => setLmpDate(e.target.value)}
                            className="input"
                            max={new Date().toISOString().split('T')[0]}
                            id="lmp-date"
                            style={{ padding: '10px 14px', fontSize: '0.9rem', marginBottom: 0, borderRadius: '12px' }}
                        />
                        {lmpDate && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1rem' }}>✨</span> Week {currentWeek} · {Math.max(0, Math.ceil((dueDate!.getTime() - new Date().getTime()) / 86400000))} days to go
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs - Mobile Responsive Strip */}
            <div className="insights-tabs" style={{ marginBottom: '24px' }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveSection(t.key)}
                        className={`insights-tab ${activeSection === t.key ? 'active' : ''}`}
                        style={{ padding: '12px 20px', borderRadius: '16px' }}
                        id={`pregnancy-tab-${t.key}`}
                    >
                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{t.label.split(' ')[0]}</span>
                        <span style={{ fontWeight: 600 }}>{t.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                ))}
            </div>

            {/* ── No LMP entered yet — gentle prompt ───────────────────── */}
            {!lmpDate && (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    marginBottom: '20px',
                    background: 'var(--bg-card)',
                    border: '2px dashed var(--border-strong)',
                    borderRadius: '32px'
                }}>
                    <div className="animate-float" style={{ fontSize: '4rem', marginBottom: '20px' }}>🌸</div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>
                        Start Your Journey
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px' }}>
                        Enter the <strong>first day of your last period</strong> in the tracker above to unlock your personalized week-by-week pregnancy companion.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                        <span>✨ Week-by-week milestones</span>
                    </div>
                </div>
            )}

            {/* ── Tracker ──────────────────────────────────────────────── */}
            {activeSection === 'tracker' && lmpDate && currentWeek && (
                <div className="stagger-children">
                    {/* Big stats */}
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, rgba(244,114,182,0.06) 0%, rgba(167,139,250,0.06) 100%)',
                        marginBottom: '20px',
                    }}>
                        <div className="insights-stats-grid" style={{ marginBottom: '28px' }}>
                            {[
                                { value: currentWeek, label: 'Weeks', icon: '🗓️', color: 'var(--primary)' },
                                { value: trimester, label: 'Trimester', icon: '3️⃣', color: '#a78bfa' },
                                { value: daysPregnant, label: 'Days Along', icon: '⏳', color: '#fb923c' },
                            ].map((stat, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stat.icon}</div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '6px' }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div style={{ padding: '0 8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px' }}>
                                <span>Day 1</span>
                                <span style={{ color: 'var(--primary)' }}>{Math.round(progressPct)}% Progress</span>
                                <span>Day 280</span>
                            </div>
                            <div className="progress-bar" style={{ height: '14px', borderRadius: '7px' }}>
                                <div className="progress-fill" style={{ width: `${progressPct}%`, borderRadius: '7px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                {[
                                    { label: 'T1', active: (currentWeek) <= 12 },
                                    { label: 'T2', active: currentWeek >= 13 && currentWeek <= 27 },
                                    { label: 'T3', active: currentWeek >= 28 }
                                ].map((t, i) => (
                                    <div key={i} style={{
                                        fontSize: '0.72rem',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: t.active ? 'var(--primary)' : 'rgba(244,114,182,0.1)',
                                        color: t.active ? 'white' : 'var(--text-muted)',
                                        fontWeight: 800
                                    }}>
                                        {t.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Due date + this week */}
                    <div className="grid-2" style={{ gap: '16px' }}>
                        <div className="card" style={{ background: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.2)' }}>
                            <div className="section-title" style={{ marginBottom: '16px' }}>
                                <span className="section-title-icon" style={{ background: 'rgba(251,146,60,0.1)' }}>⏰</span>
                                Estimated Due Date
                            </div>
                            {dueDate && (
                                <>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                        {dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="chip chip-sm" style={{ background: 'rgba(251,146,60,0.1)', color: '#c2410c', border: 'none' }}>
                                        {Math.ceil((dueDate.getTime() - new Date().getTime()) / 86400000)} days remaining
                                    </div>
                                </>
                            )}
                        </div>

                        {weekInfo && (
                            <div className="card" style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.2)' }}>
                                <div className="section-title" style={{ marginBottom: '16px' }}>
                                    <span className="section-title-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>👶</span>
                                    Week {currentWeek} Baby
                                </div>
                                <div className="grid-2" style={{ gap: '10px' }}>
                                    <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>🍓</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Size Of</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{weekInfo.size}</div>
                                    </div>
                                    <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>⚡</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Milestone</div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{weekInfo.milestone}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Timeline ─────────────────────────────────────────────── */}
            {activeSection === 'timeline' && (
                <div className="card">
                    <div className="section-title" style={{ marginBottom: '24px' }}>
                        <span className="section-title-icon">📅</span>
                        40-Week Journey
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {[1, 2, 3].map(tri => (
                            <div key={tri}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 20px', borderRadius: 'var(--radius-full)',
                                    background: tri === 1 ? 'rgba(244,114,182,0.12)' : tri === 2 ? 'rgba(251,146,60,0.12)' : 'rgba(167,139,250,0.12)',
                                    marginBottom: '16px', fontSize: '0.9rem', fontWeight: 800,
                                    color: tri === 1 ? 'var(--primary-dark)' : tri === 2 ? '#c2410c' : 'var(--secondary)',
                                    border: '1px solid currentColor'
                                }}>
                                    Trimester {tri} {tri === 1 ? '(Weeks 1–12)' : tri === 2 ? '(Weeks 13–27)' : '(Weeks 28–40)'}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '12px'
                                }}>
                                    {WEEK_INFO.filter(w => w.trimester === tri).map(w => {
                                        const isCurrent = currentWeek === w.week;
                                        const isPast = (currentWeek ?? 0) > w.week;
                                        return (
                                            <div key={w.week}
                                                style={{
                                                    padding: '16px', borderRadius: '16px',
                                                    background: isCurrent ? 'rgba(244,114,182,0.1)' : isPast ? 'rgba(52,211,153,0.04)' : 'var(--bg-card)',
                                                    border: `2px solid ${isCurrent ? 'var(--primary)' : isPast ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
                                                    position: 'relative',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isCurrent ? 'var(--shadow-md)' : 'none'
                                                }}
                                            >
                                                {isCurrent && (
                                                    <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--grad-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '2px 10px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(236,72,153,0.3)' }}>
                                                        CURRENT
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: isPast ? '#059669' : isCurrent ? 'var(--primary-dark)' : 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    {isPast ? '✓ ' : ''}Week {w.week}
                                                </div>
                                                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 900, marginTop: '4px' }}>{w.size}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>{w.milestone}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Symptoms ─────────────────────────────────────────────── */}
            {activeSection === 'symptoms' && (
                <div className="card">
                    <div className="section-title" style={{ marginBottom: '20px' }}>
                        <span className="section-title-icon">🩺</span>
                        Log Pregnancy Symptoms
                    </div>
                    <div className="tags-grid" style={{ marginBottom: '24px' }}>
                        {PREGNANCY_SYMPTOMS.map(s => (
                            <button key={s} className={`tag ${symptoms.includes(s) ? 'selected' : ''}`}
                                style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '0.9rem' }}
                                onClick={() => setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>
                                {s}
                            </button>
                        ))}
                    </div>
                    {symptoms.length > 0 && (
                        <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(244,114,182,0.08)', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {symptoms.map(s => <span key={s} className="chip chip-sm" style={{ background: 'white', border: '1px solid var(--border)' }}>{s}</span>)}
                        </div>
                    )}
                    <button className="btn btn-primary btn-lg"
                        style={{ width: '100%', borderRadius: '18px' }}
                        onClick={() => { showToast('Pregnancy symptoms logged! 🤰', 'success'); setSymptoms([]); }}
                        id="log-preg-symptoms-btn">
                        Log Symptoms Today
                    </button>
                </div>
            )}

            {/* ── Checklist ────────────────────────────────────────────── */}
            {activeSection === 'checklist' && (
                <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {([1, 2, 3] as const).map(tri => (
                        <div key={tri} className="card" style={{
                            borderLeft: `6px solid ${tri === 1 ? 'var(--primary)' : tri === 2 ? '#fb923c' : '#a78bfa'}`,
                            ...(trimester === tri ? { boxShadow: '0 12px 24px rgba(244,114,182,0.12)' } : { opacity: 0.9 })
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div className="section-title" style={{ marginBottom: 0, color: tri === 1 ? 'var(--primary)' : tri === 2 ? '#fb923c' : '#a78bfa' }}>
                                    <span className="section-title-icon">✅</span>
                                    Trimester {tri} Checklist
                                </div>
                                {trimester === tri && (
                                    <span className="chip chip-sm" style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', border: 'none', fontWeight: 800 }}>
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {TRIMESTER_CHECKLISTS[tri].map((item, i) => (
                                    <TrimesterCheckItem key={i} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
