'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AVAILABLE_MODELS } from '@/constants/ai-data';

const THEMES = [
    { key: 'light', label: 'Rose Petal', desc: 'Soft pink & white', preview: ['#fff5f7', '#f472b6', '#a78bfa'] },
    { key: 'dark', label: 'Midnight Bloom', desc: 'Dark & mysterious', preview: ['#12060d', '#f472b6', '#a78bfa'] },
];

const BIRTH_CONTROL_OPTIONS = [
    'None', 'Combined pill', 'Mini pill (progestin-only)', 'IUD (hormonal)',
    'IUD (copper)', 'Implant', 'Depo injection', 'Patch', 'Ring', 'Condoms', 'Natural methods', 'Other'
];

const GOALS = [
    { key: 'general', label: '📋 General Tracking', desc: 'Track cycle, symptoms & health' },
    { key: 'ttc', label: '🌱 Trying to Conceive', desc: 'Focus on fertile windows & ovulation' },
    { key: 'avoid', label: '🙅 Avoid Pregnancy', desc: 'Identify fertile days to avoid' },
    { key: 'health', label: '💊 Health Monitoring', desc: 'Track symptoms & hormonal health' },
];

export default function SettingsPage() {
    const { state, dispatch, showToast } = useApp();
    const [activeSection, setActiveSection] = useState<'profile' | 'cycle' | 'ai' | 'notifications' | 'data' | 'about'>('profile');
    const [name, setName] = useState(state.profile.name || '');
    const [age, setAge] = useState(state.profile.age?.toString() || '');
    const [pronouns, setPronouns] = useState(state.profile.pronouns || '');
    const [cycleLength, setCycleLength] = useState(state.profile.averageCycleLength.toString());
    const [periodLength, setPeriodLength] = useState(state.profile.averagePeriodLength.toString());
    const [goal, setGoal] = useState(state.profile.trackingGoal);
    const [birthControl, setBirthControl] = useState(state.profile.birthControlMethod || 'None');
    const [notifications, setNotifications] = useState(state.profile.notifications);
    const [reminderDays, setReminderDays] = useState(state.profile.reminderDays);
    const [aiModel, setAiModel] = useState(state.profile.aiModel || 'gemini-flash-latest');

    // LMP — derive from most recent cycle or profile
    const derivedLmp = (
        state.cycles.length > 0
            ? state.cycles[state.cycles.length - 1].startDate
            : state.profile.lastPeriodStart || ''
    );
    const [lmpDate, setLmpDate] = useState(derivedLmp);
    const [lmpSaved, setLmpSaved] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const saveLmp = () => {
        if (!lmpDate) return;
        const periodLen = Math.max(1, Math.min(10, parseInt(periodLength) || 5));

        // 1. Update profile
        dispatch({ type: 'SET_PROFILE', payload: { lastPeriodStart: lmpDate } });

        // 2. Update or create cycle entry
        if (state.cycles.length > 0) {
            dispatch({
                type: 'UPDATE_CYCLE',
                payload: {
                    id: state.cycles[state.cycles.length - 1].id,
                    data: { startDate: lmpDate, periodLength: periodLen },
                }
            });
        } else {
            dispatch({
                type: 'ADD_CYCLE',
                payload: {
                    id: `cycle_${Date.now()}`,
                    startDate: lmpDate,
                    periodLength: periodLen,
                }
            });
        }

        // 3. Re-seed daily flow logs for each period day (heavy → medium → light)
        for (let i = 0; i < periodLen; i++) {
            const d = new Date(lmpDate + 'T00:00:00');
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            dispatch({
                type: 'LOG_DAY',
                payload: {
                    date: dateStr,
                    flow: i === 0 ? 'heavy' : i < periodLen - 1 ? 'medium' : 'light',
                    symptoms: [],
                }
            });
        }

        setLmpSaved(true);
        setTimeout(() => setLmpSaved(false), 2500);
        showToast('Last period date updated! 🌹 All predictions recalculated.', 'success');
    };

    const saveProfile = () => {
        dispatch({
            type: 'SET_PROFILE',
            payload: {
                name: name.trim() || 'Luna',
                age: age ? parseInt(age) : undefined,
                pronouns,
                averageCycleLength: Math.max(21, Math.min(40, parseInt(cycleLength) || 28)),
                averagePeriodLength: Math.max(1, Math.min(10, parseInt(periodLength) || 5)),
                trackingGoal: goal as any,
                birthControlMethod: birthControl === 'None' ? undefined : birthControl,
                notifications,
                reminderDays,
                aiModel,
            }
        });
        showToast('Profile saved! 🌸', 'success');
    };

    const exportData = () => {
        const data = JSON.stringify(state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luna-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported! 📦', 'success');
    };

    const exportCSV = () => {
        const headers = ['Date', 'Flow', 'Mood', 'Symptoms', 'Notes', 'Sleep Hours', 'Water', 'Energy', 'Pain', 'Temperature', 'Weight'];
        const rows = state.logs.map(l => [
            l.date, l.flow || '', l.mood || '',
            (l.symptoms || []).join('; '), l.notes || '',
            l.sleepHours || '', l.waterIntake || '',
            l.energyLevel || '', l.painLevel || '',
            l.temperature || '', l.weight || '',
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luna-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showToast('CSV exported! 📊', 'success');
    };

    const clearData = () => {
        if (window.confirm('Are you sure? This will delete ALL your data and cannot be undone.')) {
            localStorage.removeItem('luna_app_state');
            window.location.reload();
        }
    };

    const SECTIONS = [
        { key: 'profile' as const, label: '👤 Profile', icon: '👤' },
        { key: 'cycle' as const, label: '🔄 Cycle Settings', icon: '🔄' },
        { key: 'ai' as const, label: '✨ AI Assistant', icon: '✨' },
        { key: 'notifications' as const, label: '🔔 Notifications', icon: '🔔' },
        { key: 'data' as const, label: '📦 Data & Privacy', icon: '📦' },
        { key: 'about' as const, label: 'ℹ️ About Luna', icon: 'ℹ️' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Mobile Nav: Horizontal Scroll Strip */}
            <div className="mobile-only" style={{ marginBottom: '16px' }}>
                <div className="insights-tabs" style={{ marginBottom: '12px' }}>
                    {SECTIONS.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`insights-tab ${activeSection === s.key ? 'active' : ''}`}
                            style={{ flex: '0 0 auto', padding: '10px 16px', borderRadius: '14px' }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                    ))}
                </div>
                <div style={{
                    padding: '8px 12px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {SECTIONS.find(s => s.key === activeSection)?.icon}
                    {SECTIONS.find(s => s.key === activeSection)?.label.split(' ').slice(1).join(' ')}
                </div>
            </div>

            <div className="settings-layout">
                {/* Desktop Sidebar Nav */}
                <div className="desktop-only">
                    <div className="card" style={{ padding: '12px', position: 'sticky', top: '24px' }}>
                        <div className="settings-nav-desktop">
                            <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Settings</div>
                            </div>
                            {SECTIONS.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveSection(s.key)}
                                    className={`nav-item ${activeSection === s.key ? 'active' : ''}`}
                                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                    id={`settings-${s.key}`}
                                >
                                    <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                                    <span style={{ fontSize: '0.85rem' }}>{s.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div style={{ minWidth: 0 }}>
                    {/* Profile Section */}
                    {activeSection === 'profile' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div className="section-header" style={{ marginBottom: '24px' }}>
                                    <div className="section-title">
                                        <span className="section-title-icon">👤</span>
                                        Personal Profile
                                    </div>
                                    <button onClick={saveProfile} className="btn btn-primary btn-sm desktop-only">Save Profile</button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '20px', background: 'rgba(244,114,182,0.06)', borderRadius: '20px', border: '1px solid rgba(244,114,182,0.1)' }}>
                                    <div style={{
                                        width: '72px', height: '72px', borderRadius: '50%',
                                        background: 'var(--grad-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2rem', color: 'white', fontWeight: 700,
                                        boxShadow: '0 8px 16px rgba(236,72,153,0.3)',
                                    }}>
                                        {name.charAt(0) || '🌸'}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{name || 'Your Name'}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                            <span className="chip chip-sm" style={{ background: 'rgba(244,114,182,0.1)', color: 'var(--primary)', border: 'none' }}>Member</span>
                                            {age && <span className="chip chip-sm" style={{ background: 'var(--bg-secondary)', border: 'none' }}>{age} yrs</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="insights-stats-grid" style={{ gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Your name" id="settings-name" />
                                    </div>
                                    <div>
                                        <label className="input-label">Age</label>
                                        <input type="number" value={age} onChange={e => setAge(e.target.value)} className="input" placeholder="Your age" min="10" max="80" id="settings-age" />
                                    </div>
                                    <div>
                                        <label className="input-label">Pronouns</label>
                                        <input type="text" value={pronouns} onChange={e => setPronouns(e.target.value)} className="input" placeholder="she/her, they/them..." id="settings-pronouns" />
                                    </div>
                                    <div>
                                        <label className="input-label">Birth Control</label>
                                        <select value={birthControl} onChange={e => setBirthControl(e.target.value)} className="input" id="settings-birth-control">
                                            {BIRTH_CONTROL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label className="input-label" style={{ marginBottom: '12px' }}>Tracking Goal</label>
                                    <div className="insights-stats-grid" style={{ gap: '12px' }}>
                                        {GOALS.map(g => (
                                            <div
                                                key={g.key}
                                                onClick={() => setGoal(g.key as any)}
                                                style={{
                                                    padding: '16px', borderRadius: '16px', cursor: 'pointer',
                                                    background: goal === g.key ? 'rgba(244,114,182,0.1)' : 'rgba(244,114,182,0.03)',
                                                    border: `2px solid ${goal === g.key ? 'var(--primary)' : 'var(--border)'}`,
                                                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    transform: goal === g.key ? 'scale(1.02)' : 'scale(1)',
                                                }}
                                                id={`goal-${g.key}`}
                                            >
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{g.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{g.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '18px' }}>
                                    <span className="section-title-icon">🎨</span>
                                    Appearance
                                </div>
                                <div className="grid-2" style={{ gap: '14px' }}>
                                    {THEMES.map(t => (
                                        <div
                                            key={t.key}
                                            onClick={() => dispatch({ type: 'SET_PROFILE', payload: { theme: t.key as any } })}
                                            style={{
                                                padding: '20px', borderRadius: '20px', cursor: 'pointer',
                                                border: `2px solid ${state.profile.theme === t.key ? 'var(--primary)' : 'var(--border)'}`,
                                                transition: 'all 0.2s',
                                                background: state.profile.theme === t.key ? 'rgba(244,114,182,0.06)' : 'var(--bg-card)',
                                                position: 'relative'
                                            }}
                                            id={`theme-${t.key}`}
                                        >
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                                {t.preview.map((c, i) => (
                                                    <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,0.2)' }} />
                                                ))}
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{t.label}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                                            {state.profile.theme === t.key && (
                                                <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--primary)', fontWeight: 900 }}>✓</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={saveProfile} style={{ width: '100%', borderRadius: '18px' }}>
                                💾 Save All Changes
                            </button>
                        </div>
                    )}

                    {/* Cycle Settings */}
                    {activeSection === 'cycle' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '24px' }}>
                                    <span className="section-title-icon">🔄</span>
                                    Cycle Configuration
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '32px' }}>
                                    <div className="range-container">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <label className="input-label" style={{ marginBottom: 0 }}>Average Cycle Length</label>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>{cycleLength} <small style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.7 }}>days</small></span>
                                        </div>
                                        <input type="range" min="21" max="40" value={cycleLength}
                                            onChange={e => setCycleLength(e.target.value)}
                                            className="range-slider" id="cycle-length-slider" />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <span>21 days</span><span>Target: 28-32</span><span>40 days</span>
                                        </div>
                                    </div>

                                    <div className="range-container">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <label className="input-label" style={{ marginBottom: 0 }}>Average Period Length</label>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>{periodLength} <small style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.7 }}>days</small></span>
                                        </div>
                                        <input type="range" min="1" max="10" value={periodLength}
                                            onChange={e => setPeriodLength(e.target.value)}
                                            className="range-slider" id="period-length-slider" />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <span>1 day</span><span>Normal: 3-7</span><span>10 days</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="insights-stats-grid" style={{ gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { label: 'Next Ovulation', value: `Day ${Math.round(parseInt(cycleLength) - 14)}`, icon: '🌟' },
                                        { label: 'Fertile Mode', value: goal === 'ttc' ? 'Active' : 'Tracking', icon: '🌱' },
                                    ].map((r, i) => (
                                        <div key={i} style={{ padding: '16px', background: 'rgba(244,114,182,0.06)', borderRadius: '16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{r.icon}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{r.label}</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '24px', background: 'rgba(244,114,182,0.04)', borderRadius: '20px', marginBottom: '24px', border: '1.5px dashed var(--border)' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>📅 Last Period Start (LMP)</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Updates all future predictions and cycle history.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="date"
                                            value={lmpDate}
                                            onChange={e => { setLmpDate(e.target.value); setLmpSaved(false); }}
                                            className="input"
                                            max={today}
                                            id="settings-lmp-date"
                                            style={{ flex: 1, minWidth: '180px', height: '48px' }}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={saveLmp}
                                            disabled={!lmpDate || lmpDate === derivedLmp}
                                            style={{ height: '48px', padding: '0 24px', borderRadius: '14px', whiteSpace: 'nowrap' }}
                                        >
                                            {lmpSaved ? '✓ Updated' : '🌹 Update LMP'}
                                        </button>
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-lg" onClick={saveProfile} style={{ width: '100%', borderRadius: '18px' }}>
                                    💾 Save Cycle Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Assistant Section */}
                    {activeSection === 'ai' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div className="section-header" style={{ marginBottom: '24px' }}>
                                    <div className="section-title">
                                        <span className="section-title-icon">✨</span>
                                        Dr. Luna AI Settings
                                    </div>
                                    <button onClick={saveProfile} className="btn btn-primary btn-sm desktop-only">Save Changes</button>
                                </div>

                                <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.12))', borderRadius: '20px', padding: '24px', marginBottom: '28px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div className="animate-float" style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', boxShadow: '0 8px 24px rgba(167,139,250,0.4)' }}>✨</div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Personalize Your Assistant</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Choose the engine that powers Dr. Luna&apos;s responses and cycle summaries.</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {AVAILABLE_MODELS.map(m => {
                                        const isSelected = aiModel === m.name;
                                        return (
                                            <button
                                                key={m.name}
                                                onClick={() => setAiModel(m.name)}
                                                style={{
                                                    width: '100%',
                                                    padding: '20px',
                                                    borderRadius: '20px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px',
                                                    textAlign: 'left',
                                                    background: isSelected ? `${m.color}15` : 'var(--bg-card)',
                                                    border: `2px solid ${isSelected ? m.color : 'var(--border)'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    boxShadow: isSelected ? `0 4px 20px ${m.color}20` : 'none',
                                                }}
                                                className="model-option-btn"
                                            >
                                                {isSelected && (
                                                    <div style={{ position: 'absolute', top: '20px', right: '20px', color: m.color, fontSize: '1.4rem', fontWeight: 900 }}>✓</div>
                                                )}
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{m.label}</span>
                                                    <span style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: '12px', background: `${m.color}30`, color: m.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.tag}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', opacity: 0.6 }}>Speed</span>
                                                        <div style={{ display: 'flex', gap: '3px' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < m.speed ? m.color : 'var(--border)' }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', opacity: 0.6 }}>Quality</span>
                                                        <div style={{ display: 'flex', gap: '3px' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < m.quality ? m.color : 'var(--border)' }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button className="btn btn-primary btn-lg" onClick={saveProfile} style={{ width: '100%', borderRadius: '18px', marginTop: '24px' }}>
                                    💾 Save AI Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Section */}
                    {activeSection === 'notifications' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '24px' }}>
                                    <span className="section-title-icon">🔔</span>
                                    Notification Preferences
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { label: 'Push Notifications', desc: 'Period reminders and fertility alerts', value: notifications, set: setNotifications, icon: '🔔' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ fontSize: '1.4rem' }}>{item.icon}</div>
                                                <div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                                </div>
                                            </div>
                                            <label className="toggle">
                                                <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} />
                                                <span className="toggle-slider" />
                                            </label>
                                        </div>
                                    ))}

                                    <div style={{ padding: '24px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Period Reminder Timing</div>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{reminderDays} <small style={{ fontWeight: 600, fontSize: '0.7rem' }}>days before</small></span>
                                        </div>
                                        <input type="range" min="1" max="7" value={reminderDays}
                                            onChange={e => setReminderDays(Number(e.target.value))}
                                            className="range-slider" id="reminder-days-slider" />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <span>1 day before</span><span>7 days before</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '18px', background: 'rgba(167,139,250,0.08)', borderRadius: '16px', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', gap: '14px', alignItems: 'start', marginBottom: '24px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Install Luna as a <strong>Web App (PWA)</strong> via your browser settings for a native notification experience.
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-lg" onClick={saveProfile} style={{ width: '100%', borderRadius: '18px' }}>
                                    💾 Save Notification Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Data & Privacy Section */}
                    {activeSection === 'data' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '16px' }}>
                                    <span className="section-title-icon">📦</span>
                                    Export & Backup
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                                    Your data stays on your device. Use these tools to back up or move your history.
                                </p>
                                <div className="insights-stats-grid" style={{ gap: '12px' }}>
                                    <button className="btn btn-primary" onClick={exportData} style={{ height: '56px', borderRadius: '16px' }}>
                                        📦 Export JSON
                                    </button>
                                    <button className="btn btn-secondary" onClick={exportCSV} style={{ height: '56px', borderRadius: '16px' }}>
                                        📊 Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ border: '2px solid rgba(244,63,94,0.1)' }}>
                                <div className="section-title" style={{ marginBottom: '16px', color: 'var(--danger)' }}>
                                    <span className="section-title-icon" style={{ background: 'rgba(244,63,94,0.1)' }}>⚠️</span>
                                    Danger Zone
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                                    Permanently reset all local data. This action is irreversible.
                                </p>
                                <button className="btn" onClick={clearData}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(244,63,94,0.1)', color: 'var(--danger)', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 800 }}>
                                    🗑️ Reset All App Data
                                </button>
                            </div>

                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '16px' }}>
                                    <span className="section-title-icon">🔒</span>
                                    Privacy Ledger
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { icon: '🏠', text: 'Local-only storage by default' },
                                        { icon: '🚫', text: 'No third-party trackers' },
                                        { icon: '💎', text: 'Encrypted browser storage use' }
                                    ].map((l, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{l.icon}</span> {l.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* About Section */}
                    {activeSection === 'about' && (
                        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card">
                                <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '12px' }}>
                                    <div className="animate-float" style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'var(--grad-primary)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', boxShadow: '0 12px 32px rgba(236,72,153,0.35)' }}>
                                        🌸
                                    </div>
                                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>Luna</h2>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Version 1.1.0 — Cycle Clarity</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                    {[
                                        { icon: '📋', text: 'Premium cycle tracking wizard' },
                                        { icon: '🧠', text: 'Advanced AI insights with Dr. Luna' },
                                        { icon: '📊', text: 'Responsive health data visualizations' },
                                        { icon: '🧘', text: 'Integrated wellness & meditation hub' },
                                        { icon: '🔒', text: 'Privacy-focused local data model' },
                                    ].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)', padding: '4px 0' }}>
                                            <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{f.icon}</span>
                                            {f.text}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(167,139,250,0.1))', borderRadius: '20px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '6px' }}>
                                        Designed for you with love 💗
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Dedicated to empowerment through understanding ourselves better every day.</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
