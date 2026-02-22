'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const TTC_TIPS = [
    { icon: '🌡️', title: 'Track Your BBT', desc: 'Take your basal body temperature every morning before getting up. Log it in Daily Log. A rise of 0.2°C confirms ovulation.' },
    { icon: '💧', title: 'Check Cervical Mucus', desc: 'Clear, slippery "egg white" discharge = peak fertile time. Log this in your daily notes.' },
    { icon: '📊', title: 'Ovulation Tests (OPKs)', desc: 'Start testing from day 10 of your cycle. A positive test means ovulation in 24-36 hours — time for intimacy!' },
    { icon: '🥗', title: 'Nutrition for Fertility', desc: 'Folic acid (600mcg+), iron, omega-3, and vitamin D are crucial. Reduce alcohol and processed foods.' },
    { icon: '🏃', title: 'Moderate Exercise', desc: 'Regular moderate exercise supports ovulation. Avoid extreme exercise which can stop periods.' },
    { icon: '😌', title: 'Manage Stress', desc: 'High cortisol disrupts ovulation. Try meditation, yoga, and prioritizing rest.' },
];

export default function TTCPage() {
    const { state, getNextPeriodDate, getOvulationDay, getFertileDays, getCurrentCycleDay, showToast } = useApp();
    const [activeTab, setActiveTab] = useState<'overview' | 'fertile' | 'opk' | 'tips'>('overview');
    const [opkResult, setOpkResult] = useState<'positive' | 'negative' | null>(null);
    const [cycleHistory, setCycleHistory] = useState<{ date: string; opk: 'positive' | 'negative' }[]>([]);

    const ovulationDay = getOvulationDay();
    const fertileDays = getFertileDays();
    const nextPeriod = getNextPeriodDate();
    const cycleDay = getCurrentCycleDay();
    const today = new Date().toISOString().split('T')[0];

    const isTodayFertile = fertileDays.has(today);
    const isTodayOvulation = ovulationDay === today;

    const daysToOvulation = ovulationDay
        ? Math.ceil((new Date(ovulationDay).getTime() - new Date(today).getTime()) / 86400000)
        : null;

    const logOPK = (result: 'positive' | 'negative') => {
        setOpkResult(result);
        setCycleHistory(prev => [...prev, { date: today, opk: result }]);
        if (result === 'positive') {
            showToast('🌟 Positive OPK! Ovulation expected in 24-36 hours. Best time for intimacy!', 'success');
        } else {
            showToast('OPK logged as negative. Keep testing daily.', 'info');
        }
    };

    return (
        <div className="animate-fade-in stagger-children">
            {/* Hero */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(251,146,60,0.06) 100%)',
                borderColor: 'rgba(52,211,153,0.2)',
                marginBottom: '24px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
                    <div className="animate-float" style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #34d399, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem',
                        boxShadow: '0 12px 32px rgba(52,211,153,0.25)',
                        flexShrink: 0
                    }}>🌱</div>
                    <div style={{ flex: '1 1 300px' }}>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>TTC Journey</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto' }}>
                            Precision tracking for your fertile window. Luna helps you identify peak opportunities with science-backed insights.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs - Mobile Responsive Strip */}
            <div className="insights-tabs" style={{ marginBottom: '24px' }}>
                {[
                    { key: 'overview' as const, label: '📊 Overview' },
                    { key: 'fertile' as const, label: '🌿 Fertile' },
                    { key: 'opk' as const, label: '🔬 OPK' },
                    { key: 'tips' as const, label: '💡 Tips' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`insights-tab ${activeTab === t.key ? 'active' : ''}`}
                        style={{ padding: '12px 20px', borderRadius: '16px' }}
                        id={`ttc-tab-${t.key}`}
                    >
                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{t.label.split(' ')[0]}</span>
                        <span style={{ fontWeight: 600 }}>{t.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div className="stagger-children">
                    {/* Status Card */}
                    <div className="card" style={{
                        marginBottom: '24px',
                        background: isTodayFertile || isTodayOvulation
                            ? 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(251,146,60,0.1) 100%)'
                            : 'rgba(244,114,182,0.06)',
                        border: `2px solid ${isTodayFertile || isTodayOvulation ? '#34d399' : 'var(--border)'}`,
                        textAlign: 'center',
                        padding: '32px 24px'
                    }}>
                        <div className="animate-float" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                            {isTodayOvulation ? '🌟' : isTodayFertile ? '🌿' : '📅'}
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            {isTodayOvulation ? 'Peak Fertility!' : isTodayFertile ? 'High Fertility' : 'Low Fertility'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, maxWidth: '400px', margin: '0 auto' }}>
                            {isTodayOvulation ? "It's ovulation day — your best chance to conceive is today!" : isTodayFertile ? "You are in your fertile window. Prioritize intimacy for the best results." : daysToOvulation ? `Ovulation is expected in approximately ${daysToOvulation} days.` : 'Log your period to unlock precision fertility predictions.'}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="insights-stats-grid" style={{ marginBottom: '24px' }}>
                        {[
                            { icon: '🗓️', label: 'Cycle Day', value: `Day ${cycleDay}`, color: 'var(--primary)' },
                            { icon: '🌟', label: 'Ovulation', value: ovulationDay ? new Date(ovulationDay + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', color: '#fb923c' },
                            { icon: '🌿', label: 'Window', value: fertileDays.size > 0 ? `${fertileDays.size} days` : '—', color: '#10b981' },
                            { icon: '🔄', label: 'Length', value: `${state.profile.averageCycleLength}d`, color: '#a78bfa' },
                        ].map((s, i) => (
                            <div key={i} className="card card-sm" style={{ textAlign: 'center', padding: '16px' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tip Card */}
                    <div className="card" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>💡</div>
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem' }}>Pro Tip: Timing is Everything</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    For the highest chance of conception, aim for intimacy every 24-48 hours throughout your fertile window. Sperm can thrive for up to <strong style={{ color: '#059669' }}>5 days</strong> inside the reproductive tract!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fertile Window */}
            {activeTab === 'fertile' && (
                <div className="card">
                    <div className="section-title" style={{ marginBottom: '20px' }}>
                        <span className="section-title-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>🌿</span>
                        Fertile Window Predictions
                    </div>

                    {fertileDays.size > 0 ? (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Array.from(fertileDays).sort().map(dateStr => {
                                const d = new Date(dateStr + 'T00:00:00');
                                const isOv = dateStr === ovulationDay;
                                const isTod = dateStr === today;
                                return (
                                    <div key={dateStr} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px', borderRadius: '16px',
                                        background: isOv ? 'rgba(251,146,60,0.06)' : isTod ? 'rgba(52,211,153,0.08)' : 'var(--bg-card)',
                                        border: `1px solid ${isOv ? 'rgba(251,146,60,0.3)' : isTod ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                                        boxShadow: isTod || isOv ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isOv ? 'rgba(251,146,60,0.1)' : 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                                {isOv ? '🌟' : '🌿'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: isOv ? '#c2410c' : 'var(--text-muted)', fontWeight: 600 }}>
                                                    {isOv ? 'Peak Fertility' : 'High Fertility'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {isTod && <span className="chip chip-sm" style={{ background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800 }}>TODAY</span>}
                                            {isOv && <span className="chip chip-sm" style={{ background: '#fb923c', color: 'white', border: 'none', fontWeight: 800 }}>PEAK</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'grayscale(1)' }}>🛰️</div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Waiting for Data</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '280px', margin: '0 auto' }}>Log your last period in settings to unlock your personalized fertility timeline.</p>
                        </div>
                    )}
                </div>
            )}

            {/* OPK Tracker */}
            {activeTab === 'opk' && (
                <div className="stagger-children">
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="section-title" style={{ marginBottom: '16px' }}>
                            <span className="section-title-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>🔬</span>
                            Log Daily OPK Test
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                            Ovulation Predictor Kits (OPKs) detect the LH surge that happens 24-36 hours before release.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-lg"
                                style={{ flex: '1 1 200px', background: 'var(--grad-primary)', color: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 8px 20px rgba(236,72,153,0.2)' }}
                                onClick={() => logOPK('positive')}
                                id="opk-positive"
                            >
                                <span style={{ marginRight: '8px' }}>✅</span> Positive (LH Surge)
                            </button>
                            <button
                                className="btn btn-lg btn-ghost"
                                style={{ flex: '1 1 200px', borderRadius: '18px', padding: '16px' }}
                                onClick={() => logOPK('negative')}
                                id="opk-negative"
                            >
                                <span style={{ marginRight: '8px' }}>❌</span> Negative Result
                            </button>
                        </div>

                        {opkResult && (
                            <div style={{
                                marginTop: '20px', padding: '18px', borderRadius: '20px',
                                background: opkResult === 'positive' ? 'rgba(52,211,153,0.08)' : 'rgba(244,114,182,0.06)',
                                border: `1px solid ${opkResult === 'positive' ? '#34d399' : 'var(--border)'}`,
                                fontSize: '0.9rem', color: 'var(--text-primary)',
                                fontWeight: 500, lineHeight: 1.6
                            }}>
                                {opkResult === 'positive'
                                    ? '🌟 LH Surge detected! Ovulation is imminent. Prioritize intimacy over the next 48 hours for your best chance this cycle.'
                                    : '📋 Negative result. Don\'t worry, LH surges can be quick! Keep testing daily at the same time.'}
                            </div>
                        )}
                    </div>

                    {/* OPK History */}
                    {cycleHistory.length > 0 && (
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: '16px' }}>
                                <span className="section-title-icon" style={{ background: 'var(--bg-card)' }}>📊</span>
                                Recent OPK History
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {cycleHistory.slice().reverse().map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </div>
                                        <span className="chip chip-sm" style={{
                                            background: entry.opk === 'positive' ? 'rgba(52,211,153,0.1)' : 'rgba(244,114,182,0.06)',
                                            color: entry.opk === 'positive' ? '#059669' : 'var(--text-muted)',
                                            border: 'none',
                                            fontWeight: 800
                                        }}>
                                            {entry.opk === 'positive' ? 'POSITIVE' : 'NEGATIVE'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TTC Tips */}
            {activeTab === 'tips' && (
                <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {TTC_TIPS.map((tip, i) => (
                        <div key={i} className="card" style={{
                            animationDelay: `${i * 60}ms`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '24px'
                        }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'rgba(52,211,153,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem'
                            }}>{tip.icon}</div>
                            <div>
                                <h3 style={{ fontWeight: 900, color: 'var(--text-primary)', marginBottom: '6px', fontSize: '1.1rem' }}>{tip.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
