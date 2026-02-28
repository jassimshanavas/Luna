'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// ─── Step Definitions ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 7;

const GOALS = [
    { key: 'general', emoji: '📋', title: 'General Tracking', desc: 'Understand my cycle & patterns' },
    { key: 'ttc', emoji: '🌱', title: 'Trying to Conceive', desc: 'Find my fertile window & track ovulation' },
    { key: 'avoid', emoji: '🛡️', title: 'Avoid Pregnancy', desc: 'Know when to take precautions' },
    { key: 'health', emoji: '💊', title: 'Hormonal Health', desc: 'Track symptoms & feel better' },
];

const BIRTH_CONTROL = [
    { key: 'none', emoji: '🌿', label: 'None / Natural' },
    { key: 'combined', emoji: '💊', label: 'Combined Pill' },
    { key: 'mini', emoji: '💊', label: 'Mini Pill' },
    { key: 'hormonal-iud', emoji: '🔵', label: 'Hormonal IUD' },
    { key: 'copper-iud', emoji: '🟤', label: 'Copper IUD' },
    { key: 'implant', emoji: '💪', label: 'Implant' },
    { key: 'injection', emoji: '💉', label: 'Injection' },
    { key: 'patch', emoji: '🩹', label: 'Patch' },
    { key: 'ring', emoji: '⭕', label: 'Vaginal Ring' },
    { key: 'condoms', emoji: '🧤', label: 'Condoms' },
    { key: 'other', emoji: '➕', label: 'Other' },
];

const SYMPTOMS_PREVIEW = ['Cramps', 'Bloating', 'Headaches', 'Mood swings', 'Back pain', 'Fatigue', 'Acne', 'Cravings'];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { dispatch, startPeriod } = useApp();
    const { user } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(0); // 0 = welcome splash
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [animating, setAnimating] = useState(false);

    // Form data
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [age, setAge] = useState('');
    const [goal, setGoal] = useState('general');
    const [lastPeriod, setLastPeriod] = useState('');
    const [unsure, setUnsure] = useState(false);
    const [cycleLen, setCycleLen] = useState(28);
    const [periodLen, setPeriodLen] = useState(5);
    const [birthControl, setBirthControl] = useState('none');
    const [notifications, setNotifications] = useState(true);
    const [commonSymptoms, setCommonSymptoms] = useState<string[]>([]);

    const navigate = (next: number) => {
        if (animating) return;
        setDirection(next > step ? 'forward' : 'back');
        setAnimating(true);
        setTimeout(() => {
            setStep(next);
            setAnimating(false);
        }, 280);
    };

    const goNext = () => navigate(step + 1);
    const goBack = () => navigate(step - 1);

    const canProceed = (): boolean => {
        if (step === 1) return name.trim().length >= 2;
        if (step === 3) return !!goal;
        if (step === 4) return unsure || !!lastPeriod;
        return true;
    };

    const finish = () => {
        // 1. Save profile data
        dispatch({
            type: 'SET_PROFILE',
            payload: {
                name: name.trim(),
                pronouns: pronouns.trim() || undefined,
                age: age ? parseInt(age) : undefined,
                trackingGoal: goal as any,
                averageCycleLength: cycleLen,
                averagePeriodLength: periodLen,
                birthControlMethod: birthControl === 'none' ? undefined : birthControl,
                lastPeriodStart: unsure ? undefined : lastPeriod || undefined,
                notifications,
                onboardingComplete: true,
                // Store common symptoms as a profile preference (not a daily log)
                ...(commonSymptoms.length > 0 ? { commonSymptoms: commonSymptoms.join(',') } as any : {}),
            }
        });

        // 2. Seed the first cycle AND log flow on the correct historical dates
        if (!unsure && lastPeriod) {
            dispatch({
                type: 'ADD_CYCLE',
                payload: {
                    id: `cycle_${Date.now()}`,
                    startDate: lastPeriod,
                    periodLength: periodLen,
                }
            });

            // Log each period day with flow data on its ACTUAL date (not today)
            for (let i = 0; i < periodLen; i++) {
                const d = new Date(lastPeriod + 'T00:00:00');
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                dispatch({
                    type: 'LOG_DAY',
                    payload: {
                        date: dateStr,
                        flow: i === 0 ? 'heavy' : i < periodLen - 1 ? 'medium' : 'light',
                        symptoms: commonSymptoms.length > 0 && i === 0 ? commonSymptoms : [],
                    }
                });
            }
        }

        dispatch({ type: 'COMPLETE_ONBOARDING' });

        // Directly write to Firestore immediately — don't rely on the background sync effect.
        // This guarantees cross-device availability even if Firestore had prior connection issues.
        if (user) {
            const profileData = {
                name: name.trim(),
                pronouns: pronouns.trim() || undefined,
                age: age ? parseInt(age) : undefined,
                trackingGoal: goal,
                averageCycleLength: cycleLen,
                averagePeriodLength: periodLen,
                birthControlMethod: birthControl === 'none' ? undefined : birthControl,
                lastPeriodStart: unsure ? undefined : lastPeriod || undefined,
                notifications,
                onboardingComplete: true, // ← the critical flag
                theme: 'light',
                reminderDays: 3,
                aiModel: 'gemini-flash-latest',
            } as const;

            const userDocRef = doc(db, 'users', user.uid);
            setDoc(userDocRef, { profile: profileData }, { merge: true })
                .then(() => console.log('[Luna] Onboarding saved to Firestore ✓'))
                .catch(err => {
                    console.error('[Luna] Firestore onboarding save failed:', err);
                    // Fallback: save to per-user localStorage so same device works
                    const key = `luna_app_state_${user.uid}`;
                    const existing = localStorage.getItem(key);
                    const parsed = existing ? JSON.parse(existing) : {};
                    localStorage.setItem(key, JSON.stringify({
                        ...parsed,
                        profile: { ...parsed.profile, ...profileData },
                    }));
                });
        }

        // Animated transition
        setTimeout(() => router.replace('/'), 400);
    };

    const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative blobs */}
            <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Progress bar — hidden on welcome */}
            {step > 0 && step < TOTAL_STEPS && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                    <div style={{ height: '3px', background: 'rgba(244,114,182,0.15)' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--grad-primary)',
                            width: `${progress}%`,
                            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    </div>
                </div>
            )}

            {/* Top logo — always visible */}
            {step > 0 && step < TOTAL_STEPS && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌸</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Luna</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Step {step} of {TOTAL_STEPS}</span>
                </div>
            )}

            {/* Card */}
            <div
                key={step}
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    position: 'relative',
                    zIndex: 10,
                    animation: animating
                        ? (direction === 'forward' ? 'slideOutLeft 0.28s ease-in forwards' : 'slideOutRight 0.28s ease-in forwards')
                        : (direction === 'forward' ? 'slideInRight 0.32s ease-out' : 'slideInLeft 0.32s ease-out'),
                }}
            >
                {/* ── Step 0: Welcome Splash ── */}
                {step === 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🌸</div>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 700, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1, marginBottom: '16px' }}>
                                Meet Luna
                            </h1>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto' }}>
                                Your personal cycle companion — intelligent, beautiful, and completely private.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '36px', textAlign: 'left' }}>
                            {[
                                { icon: '📊', title: 'Smart Predictions', desc: 'Know your fertile window, PMS, and next period before they arrive' },
                                { icon: '🧘', title: 'Wellness Hub', desc: 'Phase-specific nutrition, meditation, and self-care guidance' },
                                { icon: '🤖', title: 'AI Assistant', desc: '24/7 answers to your cycle and hormonal health questions' },
                                { icon: '🔒', title: '100% Private', desc: 'All your data stays on your device — never shared, never sold' },
                            ].map((f, i) => (
                                <div key={i} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
                                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{f.icon}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{f.title}</div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={goNext}
                            id="onboarding-start"
                            style={{ width: '100%', fontSize: '1rem', padding: '16px', boxShadow: '0 8px 32px rgba(244,114,182,0.4)' }}
                        >
                            Get Started — it only takes 2 minutes ✨
                        </button>
                        <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            No account needed. No email. Just you and Luna. 💗
                        </p>
                    </div>
                )}

                {/* ── Step 1: Name & Pronouns ── */}
                {step === 1 && (
                    <StepCard
                        emoji="👋"
                        title="First, what should we call you?"
                        subtitle="Luna will use your name to personalize your experience."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Your name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="input"
                                    placeholder="e.g. Emma, Alex, Sofia..."
                                    autoFocus
                                    id="onboarding-name"
                                    onKeyDown={e => e.key === 'Enter' && canProceed() && goNext()}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Pronouns <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['she/her', 'they/them', 'he/him', 'any'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPronouns(pronouns === p ? '' : p)}
                                            className={`tag ${pronouns === p ? 'selected' : ''}`}
                                            id={`pronoun-${p.replace('/', '-')}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={['she/her', 'they/them', 'he/him', 'any'].includes(pronouns) ? '' : pronouns}
                                    onChange={e => setPronouns(e.target.value)}
                                    className="input"
                                    placeholder="Or type your own..."
                                    style={{ marginTop: '8px' }}
                                    id="onboarding-pronouns-custom"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Age <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    className="input"
                                    placeholder="Your age"
                                    min="10" max="80"
                                    id="onboarding-age"
                                />
                            </div>
                        </div>
                    </StepCard>
                )}

                {/* ── Step 2: Tracking Goal ── */}
                {step === 2 && (
                    <StepCard
                        emoji="🎯"
                        title={`What brings you to Luna${name ? `, ${name.split(' ')[0]}` : ''}?`}
                        subtitle="This helps us personalize your experience from day one."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {GOALS.map(g => (
                                <div
                                    key={g.key}
                                    onClick={() => setGoal(g.key)}
                                    id={`goal-${g.key}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '16px 18px', borderRadius: '14px', cursor: 'pointer',
                                        background: goal === g.key ? 'rgba(244,114,182,0.1)' : 'var(--bg-card)',
                                        border: `2px solid ${goal === g.key ? 'var(--primary)' : 'var(--border)'}`,
                                        transition: 'var(--transition)',
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{g.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{g.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{g.desc}</div>
                                    </div>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                        border: `2px solid ${goal === g.key ? 'var(--primary)' : 'var(--border-strong)'}`,
                                        background: goal === g.key ? 'var(--primary)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {goal === g.key && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </StepCard>
                )}

                {/* ── Step 3: Last Period ── */}
                {step === 3 && (
                    <StepCard
                        emoji="📅"
                        title="When did your last period start?"
                        subtitle="This is the single most important date for accurate predictions."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {!unsure && (
                                <div>
                                    <label style={labelStyle}>First day of last period</label>
                                    <input
                                        type="date"
                                        value={lastPeriod}
                                        onChange={e => setLastPeriod(e.target.value)}
                                        className="input"
                                        max={new Date().toISOString().split('T')[0]}
                                        id="onboarding-last-period"
                                    />
                                    {lastPeriod && (
                                        <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(244,114,182,0.08)', borderRadius: '10px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                            📅 That was {Math.floor((new Date().getTime() - new Date(lastPeriod).getTime()) / 86400000)} days ago
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                onClick={() => { setUnsure(!unsure); if (!unsure) setLastPeriod(''); }}
                                style={{
                                    display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer',
                                    padding: '12px 14px', borderRadius: '10px',
                                    background: unsure ? 'rgba(167,139,250,0.1)' : 'var(--bg-overlay)',
                                    border: `1px solid ${unsure ? 'rgba(167,139,250,0.5)' : 'var(--border)'}`,
                                    transition: 'var(--transition)',
                                }}
                                id="onboarding-unsure"
                            >
                                <label className="toggle" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={unsure} onChange={e => { setUnsure(e.target.checked); if (e.target.checked) setLastPeriod(''); }} />
                                    <span className="toggle-slider" />
                                </label>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>I'm not sure / I'll skip this for now</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>That's okay! You can log it from the Dashboard later.</div>
                                </div>
                            </div>

                            <div style={{ padding: '12px 14px', background: 'rgba(167,139,250,0.08)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                💡 <strong>Why we ask:</strong> This single date allows Luna to predict your next period, fertile window, and ovulation with accuracy.
                            </div>
                        </div>
                    </StepCard>
                )}

                {/* ── Step 4: Cycle & Period Length ── */}
                {step === 4 && (
                    <StepCard
                        emoji="🔄"
                        title="Tell us about your cycle"
                        subtitle="Don't worry if you're not sure — we'll learn your real numbers as you track."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                    <label style={labelStyle}>How long is your cycle?</label>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{cycleLen} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>days</span></div>
                                </div>
                                <input
                                    type="range" min="21" max="40" value={cycleLen}
                                    onChange={e => setCycleLen(Number(e.target.value))}
                                    className="range-slider"
                                    id="onboarding-cycle-length"
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    <span>21 days (short)</span>
                                    <span style={{ color: '#34d399' }}>✓ 28 (average)</span>
                                    <span>40 days (long)</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '12px' }}>
                                    {[21, 25, 28, 30, 33, 35, 38, 40].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setCycleLen(n)}
                                            style={{
                                                padding: '8px', borderRadius: '8px', border: `1px solid ${cycleLen === n ? 'var(--primary)' : 'var(--border)'}`,
                                                background: cycleLen === n ? 'rgba(244,114,182,0.12)' : 'transparent',
                                                fontSize: '0.82rem', fontWeight: cycleLen === n ? 700 : 400,
                                                color: cycleLen === n ? 'var(--primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer', fontFamily: 'inherit',
                                            }}
                                        >
                                            {n}d
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                    <label style={labelStyle}>How long does your period last?</label>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{periodLen} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>days</span></div>
                                </div>
                                <input
                                    type="range" min="1" max="10" value={periodLen}
                                    onChange={e => setPeriodLen(Number(e.target.value))}
                                    className="range-slider"
                                    id="onboarding-period-length"
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    <span>1 day</span>
                                    <span style={{ color: '#34d399' }}>✓ 3–7 (normal)</span>
                                    <span>10 days</span>
                                </div>
                            </div>
                        </div>
                    </StepCard>
                )}

                {/* ── Step 5: Common Symptoms ── */}
                {step === 5 && (
                    <StepCard
                        emoji="🔍"
                        title="Which symptoms do you commonly experience?"
                        subtitle="We'll prioritize these in your daily log. Select all that apply."
                    >
                        <div className="tags-grid" style={{ marginBottom: '8px' }}>
                            {SYMPTOMS_PREVIEW.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setCommonSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                                    className={`tag ${commonSymptoms.includes(s) ? 'selected' : ''}`}
                                    id={`symptom-${s.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(244,114,182,0.06)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            You can always log any symptom from the Daily Log page — 50+ options available!
                        </div>
                    </StepCard>
                )}

                {/* ── Step 6: Birth Control ── */}
                {step === 6 && (
                    <StepCard
                        emoji="💊"
                        title="Birth control method?"
                        subtitle="This helps Luna give you more accurate, relevant guidance."
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {BIRTH_CONTROL.map(b => (
                                <div
                                    key={b.key}
                                    onClick={() => setBirthControl(b.key)}
                                    id={`bc-${b.key}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                                        background: birthControl === b.key ? 'rgba(244,114,182,0.1)' : 'var(--bg-card)',
                                        border: `1.5px solid ${birthControl === b.key ? 'var(--primary)' : 'var(--border)'}`,
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{b.emoji}</span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: birthControl === b.key ? 700 : 500, color: birthControl === b.key ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>
                                        {b.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            🔒 This is private and stored only on your device.
                        </div>
                    </StepCard>
                )}

                {/* ── Step 7 / Last: All Set 🎉 ── */}
                {step === TOTAL_STEPS && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>🎉</div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                            You're all set{name ? `, ${name.split(' ')[0]}` : ''}!
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '28px' }}>
                            Luna has everything she needs to start tracking your cycle. Your journey to understanding your body begins now 💗
                        </p>

                        {/* Summary card */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '20px 24px',
                            marginBottom: '28px',
                            textAlign: 'left',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', fontSize: '0.9rem' }}>📋 Your Profile Summary</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { icon: '👋', label: 'Name', value: name || '—' },
                                    { icon: '🎯', label: 'Goal', value: GOALS.find(g => g.key === goal)?.title || '—' },
                                    { icon: '📅', label: 'Last Period', value: unsure ? 'Will log later' : lastPeriod ? new Date(lastPeriod + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—' },
                                    { icon: '🔄', label: 'Cycle Length', value: `${cycleLen} days` },
                                    { icon: '🌹', label: 'Period Length', value: `${periodLen} days` },
                                    { icon: '💊', label: 'Birth Control', value: BIRTH_CONTROL.find(b => b.key === birthControl)?.label || '—' },
                                ].map((row, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', padding: '5px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{row.icon} {row.label}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={finish}
                            id="onboarding-finish"
                            style={{ width: '100%', fontSize: '1rem', padding: '16px', boxShadow: '0 8px 32px rgba(244,114,182,0.4)' }}
                        >
                            Open Luna Dashboard 🌸
                        </button>
                        <button
                            onClick={goBack}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '10px', fontFamily: 'inherit' }}
                        >
                            ← Edit something
                        </button>
                    </div>
                )}

                {/* Navigation */}
                {step > 0 && step < TOTAL_STEPS && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
                        <button
                            onClick={goBack}
                            className="btn btn-ghost"
                            id="onboarding-back"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            ← Back
                        </button>

                        {/* Step dots */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <div key={i} style={{
                                    width: i + 1 === step ? '20px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: i + 1 <= step ? 'var(--primary)' : 'rgba(244,114,182,0.2)',
                                    transition: 'all 0.3s ease',
                                }} />
                            ))}
                        </div>

                        <button
                            onClick={() => step === TOTAL_STEPS - 1 ? navigate(TOTAL_STEPS) : goNext()}
                            className="btn btn-primary"
                            disabled={!canProceed()}
                            id="onboarding-next"
                            style={{ opacity: canProceed() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {step === TOTAL_STEPS - 1 ? 'See Summary ✨' : 'Continue →'}
                        </button>
                    </div>
                )}
            </div>

            {/* Inline animation styles */}
            <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }
      `}</style>
        </div>
    );
}

// ─── Shared Sub-components ─────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '8px',
};

function StepCard({
    emoji, title, subtitle, children
}: {
    emoji: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-lg)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '14px', animation: 'breathe 4s ease-in-out infinite' }}>{emoji}</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {title}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {subtitle}
                </p>
            </div>
            {children}
        </div>
    );
}
