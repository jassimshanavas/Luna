'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp, FlowIntensity, Mood, DayLog } from '@/context/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
import { FLOW_OPTS, MOODS, PAIN_FACES, PAIN_LABELS, BODY_REGIONS } from '@/constants/log-data';

const ALL_SYMS = [
    { cat: '🩸 Flow', items: ['Spotting', 'Light flow', 'Heavy flow', 'Clots'] },
    { cat: '😣 Pain', items: ['Cramps', 'Back pain', 'Headache', 'Migraine', 'Breast tenderness', 'Pelvic pain', 'Muscle aches'] },
    { cat: '🤢 Digestive', items: ['Bloating', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Gas'] },
    { cat: '😴 Energy', items: ['Fatigue', 'Low energy', 'Brain fog', 'Insomnia', 'Oversleeping'] },
    { cat: '😊 Emotional', items: ['Mood swings', 'Irritability', 'Anxiety', 'Depression', 'Crying spells', 'Feeling overwhelmed', 'Happy', 'Confident'] },
    { cat: '💆 Skin', items: ['Acne', 'Oily skin', 'Dry skin', 'Hair loss', 'Bloated face', 'Water retention'] },
    { cat: '🍎 Appetite', items: ['Cravings – sweet', 'Cravings – salty', 'Increased appetite', 'Decreased appetite'] },
    { cat: '🌡️ Other', items: ['Hot flashes', 'Chills', 'Dizziness', 'Vaginal dryness', 'Discharge – normal'] },
];
const STEPS = ['Flow 🩸', 'Mood 💭', 'Pain 🩹', 'Symptoms 🔍', 'Wellness 💫', 'Notes 📝', 'Review ✅'];

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
    const r = 22, circ = 2 * Math.PI * r;
    return (
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle cx="28" cy="28" r={r} fill="none" stroke="#f472b6" strokeWidth="4"
                strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            <text x="28" y="33" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)" style={{ transform: 'rotate(90deg)', transformOrigin: '28px 28px' }}>
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

function WaterGlass({ glasses, onChange }: { glasses: number; onChange: (n: number) => void }) {
    const pct = (glasses / 8) * 100;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '60px', height: '90px', border: '3px solid #60a5fa', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden', background: 'var(--bg-secondary)', boxShadow: 'inset 0 4px 12px rgba(96,165,250,0.1)' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, background: 'linear-gradient(to top, #1d4ed8, #60a5fa, #bfdbfe)', transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '50% 50% 0 0' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: glasses > 4 ? 'white' : '#2563eb', fontSize: '1rem', textShadow: glasses > 4 ? '0 1px 4px rgba(0,0,0,0.2)' : 'none' }}>{glasses}</div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>Tap to track water intake</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <button key={i} onClick={() => onChange(glasses === i + 1 ? i : i + 1)}
                            style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: i < glasses ? 'var(--grad-primary)' : 'var(--bg-secondary)',
                                border: `2px solid ${i < glasses ? 'transparent' : 'var(--border)'}`,
                                fontSize: i < glasses ? '1.1rem' : '0.75rem',
                                color: i < glasses ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800,
                                transform: i < glasses ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: i < glasses ? '0 4px 12px rgba(96,165,250,0.3)' : 'none',
                            }}>
                            {i < glasses ? '💧' : i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BodyMap({ active, onToggle, readOnly = false }: { active: string[]; onToggle?: (id: string) => void, readOnly?: boolean }) {
    const pink = (id: string) => active.includes(id) ? '#f9a8d4' : 'var(--bg-secondary)';
    const stroke = (id: string) => active.includes(id) ? '#ec4899' : 'var(--border)';
    const handleClick = (id: string) => { if (!readOnly && onToggle) onToggle(id); };
    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 170" style={{ width: '100px', height: '170px', flexShrink: 0 }}>
                <ellipse cx="50" cy="16" rx="14" ry="14" fill={pink('head')} stroke={stroke('head')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('head')} />
                <rect x="44" y="29" width="12" height="9" rx="2" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
                <rect x="8" y="40" width="18" height="40" rx="7" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2" />
                <rect x="74" y="40" width="18" height="40" rx="7" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2" />
                <rect x="28" y="38" width="44" height="28" rx="6" fill={pink('chest')} stroke={stroke('chest')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('chest')} />
                <rect x="28" y="68" width="44" height="22" rx="4" fill={pink('abdomen')} stroke={stroke('abdomen')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('abdomen')} />
                <rect x="25" y="92" width="50" height="22" rx="8" fill={pink('pelvis')} stroke={stroke('pelvis')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('pelvis')} />
                <rect x="27" y="116" width="19" height="46" rx="7" fill={pink('legs')} stroke={stroke('legs')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('legs')} />
                <rect x="54" y="116" width="19" height="46" rx="7" fill={pink('legs')} stroke={stroke('legs')} strokeWidth="1.5" style={{ cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleClick('legs')} />
            </svg>
            {!readOnly && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {BODY_REGIONS.map(r => (
                        <button key={r.id} onClick={() => handleClick(r.id)} style={{
                            padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
                            background: active.includes(r.id) ? 'rgba(236,72,153,0.1)' : 'var(--bg-secondary)',
                            border: `1.5px solid ${active.includes(r.id) ? 'var(--primary)' : 'var(--border)'}`,
                            color: active.includes(r.id) ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                        }}>{active.includes(r.id) ? '✓ ' : ''}{r.label}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CelebrationOverlay({ onDone }: { onDone: () => void }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const t = setTimeout(onDone, 2600);
        return () => clearTimeout(t);
    }, []);
    if (!mounted) return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', top: '-20px',
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 12 + 6}px`, height: `${Math.random() * 8 + 4}px`,
                    background: ['#f472b6', '#a78bfa', '#fb923c', '#34d399', '#60a5fa'][i % 5],
                    borderRadius: '2px',
                    animation: `confettiFall ${2 + Math.random() * 1.5}s ${Math.random() * 0.5}s ease-in forwards`,
                }} />
            ))}
            <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', animation: 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 20px 40px rgba(236,72,153,0.3)', marginBottom: '24px' }}>
                🌸
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', animation: 'fadeIn 0.5s 0.3s both' }}>Log Saved!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500, animation: 'fadeIn 0.5s 0.5s both' }}>You&apos;re doing amazing, {document.title.split('|')[0] || 'lovely'} ✨</p>
        </div>,
        document.body
    );
}

// ── Day Report Component ───────────────────────────────────────────────────────

function DayReport({ log, onEdit, dateLabel }: { log: DayLog, onEdit: () => void, dateLabel: string }) {
    const moodObj = MOODS.find(m => m.key === log.mood);
    const flowObj = FLOW_OPTS.find(f => f.key === (log.flow || 'none'));
    const regions = BODY_REGIONS.filter(r => r.symptoms.some(s => log.symptoms?.includes(s))).map(r => r.id);

    const wellnessMetrics = [
        { label: 'Sleep', val: log.sleepHours || 0, max: 10, color: '#8b5cf6', icon: '😴' },
        { label: 'Water', val: log.waterIntake || 0, max: 8, color: '#3b82f6', icon: '💧' },
        { label: 'Energy', val: log.energyLevel || 0, max: 5, color: '#f59e0b', icon: '⚡' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Status Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '20px', background: moodObj ? `linear-gradient(135deg, ${moodObj.color}10, transparent)` : 'var(--bg-card)', border: `1px solid ${moodObj ? moodObj.color + '30' : 'var(--border)'}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '8rem', opacity: 0.04, transform: 'rotate(12deg)' }}>{moodObj?.emoji || '🌸'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>{dateLabel} Narrative</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 700 }}>
                            Today was a <span style={{ color: moodObj?.color || 'var(--primary)' }}>{log.mood || 'stable'}</span> day. {log.flow && log.flow !== 'none' ? `Flow was ${log.flow}.` : 'No period flow logged.'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Daily Metrics</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                        {wellnessMetrics.map((m, i) => {
                            const pct = Math.min((m.val / m.max) * 100, 100);
                            return (
                                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 8px' }}>
                                        <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="4" />
                                            <circle cx="28" cy="28" r="24" fill="none" stroke={m.color} strokeWidth="4"
                                                strokeDasharray={`${(pct / 100) * (2 * Math.PI * 24)} ${(2 * Math.PI * 24)}`} strokeLinecap="round" />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{m.icon}</div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{m.val}</div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Body Status</div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <BodyMap active={regions} readOnly />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Logged Symptoms</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {log.symptoms?.slice(0, 6).map(s => (
                                    <span key={s} style={{ padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '0.7rem', fontWeight: 700 }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={onEdit} className="btn btn-primary" style={{ width: '100%', marginTop: '20px', height: '52px', borderRadius: '16px' }}>Edit Today&apos;s Entry</button>
        </div>
    );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

function LogForm() {
    const { state, dispatch, getDayLog } = useApp();
    const searchParams = useSearchParams();
    const today = new Date().toISOString().split('T')[0];
    const [logDate, setLogDate] = useState(searchParams.get('date') || today);
    const [step, setStep] = useState(0);
    const [celebrating, setCelebrating] = useState(false);
    const [mode, setMode] = useState<'report' | 'edit'>('report');

    const existingLog = getDayLog(logDate);

    // Form fields
    const [flow, setFlow] = useState<FlowIntensity>(existingLog?.flow || 'none');
    const [mood, setMood] = useState<Mood | ''>(existingLog?.mood || '');
    const [symptoms, setSymptoms] = useState<string[]>(existingLog?.symptoms || []);
    const [notes, setNotes] = useState(existingLog?.notes || '');
    const [temperature, setTemp] = useState(existingLog?.temperature?.toString() || '');
    const [weight, setWeight] = useState(existingLog?.weight?.toString() || '');
    const [sleepHours, setSleep] = useState(existingLog?.sleepHours?.toString() || '');
    const [sleepQuality, setSleepQ] = useState(existingLog?.sleepQuality || 3);
    const [waterIntake, setWater] = useState(existingLog?.waterIntake || 0);
    const [energyLevel, setEnergy] = useState(existingLog?.energyLevel || 3);
    const [painLevel, setPain] = useState(existingLog?.painLevel || 0);
    const [painRegions, setPainR] = useState<string[]>([]);
    const [pillTaken, setPill] = useState(existingLog?.pillTaken || false);
    const [sexActivity, setSex] = useState(existingLog?.sexualActivity || false);
    const [symSearch, setSymSearch] = useState('');
    const [symCat, setSymCat] = useState(0);

    useEffect(() => {
        const l = getDayLog(logDate);
        setMode(l ? 'report' : 'edit');
        setFlow(l?.flow || 'none'); setMood(l?.mood || ''); setSymptoms(l?.symptoms || []);
        setNotes(l?.notes || ''); setTemp(l?.temperature?.toString() || '');
        setWeight(l?.weight?.toString() || ''); setSleep(l?.sleepHours?.toString() || '');
        setSleepQ(l?.sleepQuality || 3); setWater(l?.waterIntake || 0);
        setEnergy(l?.energyLevel || 3); setPain(l?.painLevel || 0);
        setPill(l?.pillTaken || false); setSex(l?.sexualActivity || false);
        setPainR([]); setStep(0);
    }, [logDate]);

    const toggleSym = (s: string) => setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

    const toggleRegion = (id: string) => {
        const region = BODY_REGIONS.find(r => r.id === id)!;
        if (painRegions.includes(id)) {
            setPainR(p => p.filter(r => r !== id));
            setSymptoms(p => p.filter(s => !region.symptoms.includes(s)));
        } else {
            setPainR(p => [...p, id]);
            setSymptoms(p => [...p, ...region.symptoms.filter(s => !p.includes(s))]);
            if (painLevel === 0) setPain(2);
        }
    };

    const completionPct = useMemo(() => {
        let s = 0; if (flow !== 'none') s++; if (mood) s++; if (painLevel > 0) s++; if (symptoms.length > 0) s++;
        if (sleepHours) s++; if (waterIntake >= 1) s++; if (notes.trim()) s++; if (energyLevel !== 3) s++;
        return (s / 8) * 100;
    }, [flow, mood, painLevel, symptoms, sleepHours, waterIntake, notes, energyLevel]);

    const filteredSyms = useMemo(() => {
        const q = symSearch.toLowerCase();
        if (q) return ALL_SYMS.flatMap(c => c.items).filter(s => s.toLowerCase().includes(q));
        return ALL_SYMS[symCat].items;
    }, [symSearch, symCat]);

    const handleSave = () => {
        const log: DayLog = {
            date: logDate, flow: flow !== 'none' ? flow : undefined,
            mood: mood || undefined, symptoms,
            notes: notes.trim() || undefined,
            temperature: temperature ? parseFloat(temperature) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
            sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
            sleepQuality, waterIntake: waterIntake || undefined,
            energyLevel, painLevel, pillTaken, sexualActivity: sexActivity,
        };
        dispatch({ type: 'LOG_DAY', payload: log });
        setCelebrating(true);
    };

    const TITLE = [
        { emoji: '🩸', title: "How's your flow?", sub: 'Period intensity' },
        { emoji: '💭', title: 'Daily mood', sub: 'How are you feeling?' },
        { emoji: '🩹', title: 'Any discomfort?', sub: 'Tap where it hurts' },
        { emoji: '🔍', title: "Symptoms", sub: "Body check-in" },
        { emoji: '💫', title: 'Wellness', sub: 'Daily signals' },
        { emoji: '📝', title: 'Notes', sub: 'Personal observations' },
        { emoji: '✅', title: 'Review', sub: 'Ready to save?' },
    ][step];

    const d = new Date(logDate + 'T00:00:00');
    const dateLabel = logDate === today ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="log-form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {celebrating && <CelebrationOverlay onDone={() => { setCelebrating(false); setMode('report'); }} />}

            {/* Header Card */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px 20px', background: 'var(--grad-soft)', borderColor: 'rgba(244,114,182,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Log Entry</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dateLabel}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ProgressRing pct={completionPct} />
                        <input type="date" value={logDate} max={today} onChange={e => setLogDate(e.target.value)}
                            style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
                    </div>
                </div>
            </div>

            {mode === 'report' && existingLog ? (
                <DayReport log={existingLog} onEdit={() => setMode('edit')} dateLabel={dateLabel} />
            ) : (
                <div className="animate-fade-in">
                    {/* Stepper */}
                    <div className="sym-cat-scroll" style={{ marginBottom: '12px' }}>
                        {STEPS.map((s, i) => (
                            <button key={i} onClick={() => setStep(i)} style={{
                                flexShrink: 0, padding: '7px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                background: i === step ? 'var(--grad-rose)' : i < step ? 'rgba(244,114,182,0.1)' : 'var(--bg-secondary)',
                                color: i === step ? 'white' : i < step ? 'var(--primary)' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: i === step ? '0 4px 12px rgba(244,114,182,0.25)' : 'none'
                            }}>{i < step ? '✓' : s.split(' ')[0]}</button>
                        ))}
                    </div>

                    <div className="log-step-header">
                        <span style={{ fontSize: '2.5rem' }}>{TITLE.emoji}</span>
                        <div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{TITLE.title}</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{TITLE.sub}</p>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '20px', minHeight: '300px' }}>
                        {step === 0 && (
                            <div className="grid-2 animate-fade-in" style={{ gap: '10px' }}>
                                {FLOW_OPTS.map(f => (
                                    <button key={f.key} onClick={() => setFlow(f.key)} style={{
                                        padding: '16px', borderRadius: '16px', textAlign: 'left',
                                        background: flow === f.key ? `${f.color}15` : 'var(--bg-secondary)',
                                        border: `2px solid ${flow === f.key ? f.color : 'transparent'}`,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: flow === f.key ? f.color : 'var(--text-primary)' }}>{f.label}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="mood-wheel-wrapper animate-fade-in">
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 1 }}>
                                    <div style={{ fontSize: '3.5rem' }}>{mood ? MOODS.find(m => m.key === mood)?.emoji : '✨'}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{mood || 'Vibe'}</div>
                                </div>
                                {MOODS.map((m, i) => {
                                    const angle = (i / MOODS.length) * 360 - 90;
                                    const rad = angle * Math.PI / 180;
                                    const r = 90; // Fixed radius for container
                                    const x = 125 + r * Math.cos(rad) - 25;
                                    const y = 125 + r * Math.sin(rad) - 25;
                                    return (
                                        <button key={m.key} onClick={() => setMood(m.key)} style={{
                                            position: 'absolute', left: x, top: y, width: '50px', height: '50px', borderRadius: '50%',
                                            background: mood === m.key ? `${m.color}22` : 'var(--bg-card)', border: `2px solid ${mood === m.key ? m.color : 'var(--border)'}`,
                                            fontSize: '1.6rem', transition: 'all 0.2s'
                                        }}>{m.emoji}</button>
                                    );
                                })}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '10px' }}>{PAIN_FACES[painLevel]}</div>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        {[0, 1, 2, 3, 4, 5].map(v => (
                                            <button key={v} onClick={() => setPain(v)} style={{
                                                width: '40px', height: '40px', borderRadius: '10px', fontWeight: 800,
                                                background: painLevel === v ? 'var(--primary)' : 'var(--bg-secondary)',
                                                color: painLevel === v ? 'white' : 'var(--text-muted)', border: 'none'
                                            }}>{v}</button>
                                        ))}
                                    </div>
                                </div>
                                <BodyMap active={painRegions} onToggle={toggleRegion} />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in">
                                <input value={symSearch} onChange={e => setSymSearch(e.target.value)} placeholder="Search symptoms..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '12px' }} />
                                <div className="sym-cat-scroll">
                                    {ALL_SYMS.map((c, i) => (
                                        <button key={i} onClick={() => setSymCat(i)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', background: symCat === i ? 'var(--primary)' : 'var(--bg-secondary)', color: symCat === i ? 'white' : 'var(--text-muted)', border: 'none' }}>{c.cat}</button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {filteredSyms.map(s => (
                                        <button key={s} onClick={() => toggleSym(s)} style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', background: symptoms.includes(s) ? 'rgba(236,72,153,0.1)' : 'var(--bg-card)', border: `1.5px solid ${symptoms.includes(s) ? 'var(--primary)' : 'var(--border)'}`, color: symptoms.includes(s) ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 700 }}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>😴 Sleep Hours</label>
                                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {[4, 5, 6, 7, 8, 9, 10].map(h => (
                                            <button key={h} onClick={() => setSleep(String(h))} style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px', fontWeight: 800, background: Number(sleepHours) === h ? '#8b5cf6' : 'var(--bg-secondary)', color: Number(sleepHours) === h ? 'white' : 'var(--text-muted)', border: 'none' }}>{h}h</button>
                                        ))}
                                    </div>
                                </div>
                                <WaterGlass glasses={waterIntake} onChange={setWater} />
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>⚡ Energy Level</label>
                                    <input type="range" min="1" max="5" value={energyLevel} onChange={e => setEnergy(Number(e.target.value))} className="range-slider" style={{ width: '100%' }} />
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setPill(!pillTaken)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: pillTaken ? 'rgba(52,211,153,0.1)' : 'var(--bg-secondary)', border: `2px solid ${pillTaken ? '#10b981' : 'transparent'}`, fontWeight: 700 }}>💊 Pill Taken</button>
                                    <button onClick={() => setSex(!sexActivity)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: sexActivity ? 'rgba(236,72,153,0.1)' : 'var(--bg-secondary)', border: `2px solid ${sexActivity ? 'var(--primary)' : 'transparent'}`, fontWeight: 700 }}>💕 Sexual Activity</button>
                                </div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for today?" className="input" rows={6} style={{ width: '100%', borderRadius: '16px', padding: '16px' }} />
                            </div>
                        )}

                        {step === 6 && (
                            <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                                <div style={{ margin: '40px 0' }}>
                                    <ProgressRing pct={completionPct} />
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginTop: '16px' }}>Ready to save!</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Entry is {Math.round(completionPct)}% complete.</p>
                                </div>
                                <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', height: '56px', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem' }}>Save Daily Log</button>
                            </div>
                        )}
                    </div>

                    <div className="log-nav-mobile">
                        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" style={{ flex: 1, height: '52px', borderRadius: '14px' }}>Back</button>}
                        {step < STEPS.length - 1 && <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" style={{ flex: 2, height: '52px', borderRadius: '14px' }}>Continue</button>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LogPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
            <LogForm />
        </Suspense>
    );
}
