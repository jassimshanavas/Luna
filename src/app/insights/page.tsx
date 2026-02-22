'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

type ChartType = 'cycle' | 'symptoms' | 'mood' | 'sleep' | 'bbt' | 'weight';

const MOOD_COLORS: Record<string, string> = {
    happy: '#34d399', calm: '#60a5fa', energetic: '#fb923c',
    tired: '#a78bfa', sad: '#64748b', anxious: '#f59e0b',
    sensitive: '#f472b6', angry: '#ef4444'
};

const MOOD_EMOJI: Record<string, string> = {
    happy: '😊', calm: '😌', energetic: '⚡', tired: '😴',
    sad: '😢', anxious: '😰', sensitive: '🥺', angry: '😠',
};

export default function InsightsPage() {
    const { state } = useApp();
    const [activeChart, setActiveChart] = useState<ChartType>('cycle');

    const logs = state.logs.sort((a, b) => a.date.localeCompare(b.date));
    const cycles = state.cycles;

    // ─── Symptom frequency ───────────────────────────────────
    const symptomFreq = logs.reduce((acc, log) => {
        (log.symptoms || []).forEach(s => { acc[s] = (acc[s] || 0) + 1; });
        return acc;
    }, {} as Record<string, number>);
    const topSymptoms = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // ─── Mood distribution ───────────────────────────────────
    const moodFreq = logs.reduce((acc, log) => {
        if (log.mood) acc[log.mood] = (acc[log.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const totalMoods = Object.values(moodFreq).reduce((a, b) => a + b, 0);

    // ─── Sleep data ──────────────────────────────────────────
    const sleepData = logs.filter(l => l.sleepHours).slice(-14).map(l => ({
        date: l.date, hours: l.sleepHours || 0
    }));
    const avgSleep = sleepData.reduce((a, b) => a + b.hours, 0) / Math.max(sleepData.length, 1);

    // ─── Cycle lengths ───────────────────────────────────────
    const cycleLengths = cycles.slice(1).map((c, i) => ({
        cycle: i + 1,
        length: Math.round((new Date(c.startDate).getTime() - new Date(cycles[i].startDate).getTime()) / 86400000),
    }));

    // ─── BBT data ────────────────────────────────────────────
    const bbtData = logs.filter(l => l.temperature).slice(-30).map(l => ({
        date: l.date.slice(5), temp: l.temperature || 0
    }));

    // ─── Weight data ─────────────────────────────────────────
    const weightData = logs.filter(l => l.weight).slice(-30).map(l => ({
        date: l.date.slice(5), weight: l.weight || 0
    }));

    // ─── Regularity score ────────────────────────────────────
    const regularityScore = (() => {
        if (cycleLengths.length < 2) return null;
        const avg = cycleLengths.reduce((a, b) => a + b.length, 0) / cycleLengths.length;
        const variance = cycleLengths.reduce((a, b) => a + Math.pow(b.length - avg, 2), 0) / cycleLengths.length;
        const stdDev = Math.sqrt(variance);
        const score = Math.max(0, Math.round(100 - stdDev * 10));
        return { score, label: score >= 80 ? 'Very Regular' : score >= 60 ? 'Mostly Regular' : score >= 40 ? 'Slightly Irregular' : 'Irregular' };
    })();

    const CHARTS: { key: ChartType; label: string; icon: string }[] = [
        { key: 'cycle', label: 'Cycle', icon: '🔄' },
        { key: 'symptoms', label: 'Symptoms', icon: '🔍' },
        { key: 'mood', label: 'Mood', icon: '💭' },
        { key: 'sleep', label: 'Sleep', icon: '😴' },
        { key: 'bbt', label: 'Temperature', icon: '🌡️' },
        { key: 'weight', label: 'Weight', icon: '⚖️' },
    ];

    // ─── Reusable bar chart ──────────────────────────────────
    const renderBarChart = (data: { label: string; value: number; color: string; max: number }[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map((item, i) => (
                <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.value}x</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{
                            width: `${(item.value / item.max) * 100}%`,
                            background: item.color,
                            transition: `width 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 50}ms`,
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );

    // ─── Reusable SVG line chart ─────────────────────────────
    const renderLineChart = (data: { label: string; value: number }[], color: string, unit: string, min?: number, max?: number) => {
        if (data.length === 0) return (
            <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No data yet. Start logging to see patterns!</p>
            </div>
        );
        const vals = data.map(d => d.value);
        const minVal = min ?? Math.min(...vals) - 0.5;
        const maxVal = max ?? Math.max(...vals) + 0.5;
        const range = maxVal - minVal || 1;
        const W = 600, H = 180;

        const points = data.map((d, i) => ({
            x: (i / Math.max(data.length - 1, 1)) * (W - 40) + 20,
            y: H - ((d.value - minVal) / range) * (H - 40) - 20,
        }));

        const pathD = points.map((p, i) =>
            i === 0 ? `M ${p.x} ${p.y}` : `Q ${(points[i - 1].x + p.x) / 2} ${points[i - 1].y} ${p.x} ${p.y}`
        ).join(' ');

        const areaD = `${pathD} L ${points[points.length - 1].x} ${H + 20} L ${points[0].x} ${H + 20} Z`;

        return (
            <div>
                <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: '170px' }}>
                    <defs>
                        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                        <line key={i} x1="20" y1={H - frac * (H - 40) - 20} x2={W - 20} y2={H - frac * (H - 40) - 20}
                            stroke="rgba(244,114,182,0.1)" strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
                    <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
                    ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden' }}>
                    {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map(d => (
                        <span key={d.label} style={{ whiteSpace: 'nowrap' }}>{d.label}</span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">

            {/* ── Stats Overview: 2×2 on mobile, 4-col on desktop ── */}
            <div className="insights-stats-grid stagger-children" style={{ marginBottom: '20px' }}>
                {[
                    { icon: '🔄', label: 'Avg Cycle', value: state.profile.averageCycleLength + 'd', sub: 'days', color: undefined },
                    { icon: '🌹', label: 'Avg Period', value: state.profile.averagePeriodLength + 'd', sub: 'days', color: undefined },
                    { icon: '📋', label: 'Days Logged', value: logs.length.toString(), sub: 'entries', color: undefined },
                    {
                        icon: '📈', label: 'Regularity',
                        value: regularityScore ? `${regularityScore.score}%` : '—',
                        sub: regularityScore?.label || 'Track more cycles',
                        color: regularityScore ? (regularityScore.score >= 70 ? '#34d399' : regularityScore.score >= 50 ? '#fb923c' : '#f43f5e') : 'var(--primary)',
                    },
                ].map((s, i) => (
                    <div key={i} className="card card-sm animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                        <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, color: s.color || 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Chart Card ── */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 16px 20px' }}>

                {/* Tab strip — horizontal scroll on mobile */}
                <div className="insights-tabs" style={{ marginBottom: '20px' }}>
                    {CHARTS.map(c => (
                        <button key={c.key} onClick={() => setActiveChart(c.key)}
                            className="btn btn-sm insights-tab-btn"
                            style={{
                                background: activeChart === c.key ? 'var(--grad-rose)' : 'rgba(244,114,182,0.08)',
                                color: activeChart === c.key ? 'white' : 'var(--text-secondary)',
                                border: activeChart === c.key ? 'none' : '1px solid rgba(244,114,182,0.18)',
                            }}
                            id={`chart-tab-${c.key}`}
                        >
                            <span>{c.icon}</span>
                            <span className="insights-tab-label">{c.label}</span>
                        </button>
                    ))}
                </div>

                {/* ═══ Cycle Length Chart ═══ */}
                {activeChart === 'cycle' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">🔄</span>
                            Cycle Length History
                        </div>
                        {cycleLengths.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <p>Track at least 2 periods to see cycle length history</p>
                            </div>
                        ) : (
                            renderLineChart(
                                cycleLengths.map(c => ({ label: `C${c.cycle}`, value: c.length })),
                                '#f472b6', 'd', 20, 40
                            )
                        )}
                        {cycleLengths.length > 0 && (
                            <div className="insights-stat-row" style={{ marginTop: '14px' }}>
                                <div className="insights-stat-pill">
                                    📊 Avg <strong>{Math.round(cycleLengths.reduce((a, b) => a + b.length, 0) / cycleLengths.length)}d</strong>
                                </div>
                                <div className="insights-stat-pill">
                                    📉 Min <strong>{Math.min(...cycleLengths.map(c => c.length))}d</strong>
                                </div>
                                <div className="insights-stat-pill">
                                    📈 Max <strong>{Math.max(...cycleLengths.map(c => c.length))}d</strong>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Symptoms Chart ═══ */}
                {activeChart === 'symptoms' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">🔍</span>
                            Most Common Symptoms
                        </div>
                        {topSymptoms.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <p>Log symptoms to see your patterns here</p>
                            </div>
                        ) : (
                            renderBarChart(topSymptoms.map(([label, value]) => ({
                                label, value, color: 'var(--grad-primary)', max: topSymptoms[0][1]
                            })))
                        )}
                    </div>
                )}

                {/* ═══ Mood Chart ═══ */}
                {activeChart === 'mood' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">💭</span>
                            Mood Distribution
                        </div>
                        {Object.entries(moodFreq).length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">💭</div>
                                <p>Log your mood daily to see patterns</p>
                            </div>
                        ) : (
                            <div>
                                {/* Donut + legend: stacks on mobile */}
                                <div className="insights-mood-layout">
                                    <div className="insights-mood-chart">
                                        <svg width="150" height="150" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
                                            {(() => {
                                                let angle = -90;
                                                return Object.entries(moodFreq).map(([mood, count], i) => {
                                                    const pct = count / totalMoods;
                                                    const startAngle = angle;
                                                    angle += pct * 360;
                                                    const r = 70, cx = 90, cy = 90;
                                                    const toRad = (deg: number) => (deg * Math.PI) / 180;
                                                    const x1 = cx + r * Math.cos(toRad(startAngle));
                                                    const y1 = cy + r * Math.sin(toRad(startAngle));
                                                    const x2 = cx + r * Math.cos(toRad(angle - 0.5));
                                                    const y2 = cy + r * Math.sin(toRad(angle - 0.5));
                                                    const largeArc = pct > 0.5 ? 1 : 0;
                                                    const colors = ['#f472b6', '#a78bfa', '#34d399', '#fb923c', '#60a5fa', '#f59e0b', '#64748b', '#ef4444'];
                                                    return (
                                                        <path key={mood}
                                                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                            fill={colors[i % colors.length]}
                                                            stroke="white" strokeWidth="2"
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                    </div>
                                    {/* Legend — 2-col grid on mobile for compactness */}
                                    <div className="insights-mood-legend">
                                        {Object.entries(moodFreq).sort((a, b) => b[1] - a[1]).map(([m, count]) => (
                                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{MOOD_EMOJI[m] || '💭'} {m}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, marginLeft: '8px' }}>{count}x <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.76rem' }}>({Math.round((count / totalMoods) * 100)}%)</span></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Sleep Chart ═══ */}
                {activeChart === 'sleep' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">😴</span>
                            Sleep Patterns (last 14 days)
                        </div>
                        {renderLineChart(
                            sleepData.map(d => ({ label: d.date.slice(5), value: d.hours })),
                            '#a78bfa', 'h', 4, 10
                        )}
                        {sleepData.length > 0 && (
                            <div className="insights-stat-row" style={{ marginTop: '12px', background: 'rgba(167,139,250,0.08)', padding: '12px', borderRadius: '12px' }}>
                                <div className="insights-stat-pill" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
                                    💤 Avg <strong style={{ color: '#a78bfa' }}>{avgSleep.toFixed(1)}h</strong>
                                </div>
                                <div className="insights-stat-pill" style={{ borderColor: 'rgba(167,139,250,0.3)' }}>
                                    🎯 Goal <strong>7–9h</strong>
                                </div>
                                <div className="insights-stat-pill" style={{ borderColor: 'rgba(167,139,250,0.3)', color: avgSleep >= 7 ? '#34d399' : '#fb923c' }}>
                                    {avgSleep >= 7 ? '✓ Great!' : '⚠ Try more'}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ BBT Chart ═══ */}
                {activeChart === 'bbt' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">🌡️</span>
                            Basal Body Temperature (last 30 days)
                        </div>
                        {renderLineChart(
                            bbtData.map(d => ({ label: d.date, value: d.temp })),
                            '#fb923c', '°C', 36, 37.5
                        )}
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(251,146,60,0.1)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            💡 <strong>Tip:</strong> BBT rises ~0.2°C after ovulation. Track it first thing in the morning before getting up.
                        </div>
                    </div>
                )}

                {/* ═══ Weight Chart ═══ */}
                {activeChart === 'weight' && (
                    <div>
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">⚖️</span>
                            Weight Trends (last 30 days)
                        </div>
                        {renderLineChart(
                            weightData.map(d => ({ label: d.date, value: d.weight })),
                            '#34d399', 'kg'
                        )}
                    </div>
                )}
            </div>

            {/* ── Cycle History Table ── */}
            {cycles.length > 0 && (
                <div className="card" style={{ padding: '16px 0' }}>
                    <div className="section-title" style={{ marginBottom: '14px', padding: '0 16px' }}>
                        <span className="section-title-icon">📋</span>
                        Cycle History
                    </div>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', minWidth: '480px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    {['#', 'Start', 'End', 'Period', 'Cycle', 'Notes'].map(h => (
                                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cycles.map((c, i) => {
                                    const nextStart = cycles[i + 1]?.startDate;
                                    const cycleLen = nextStart
                                        ? Math.round((new Date(nextStart).getTime() - new Date(c.startDate).getTime()) / 86400000)
                                        : null;
                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                                            <td style={{ padding: '9px 14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {new Date(c.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '9px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {c.endDate ? new Date(c.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                            </td>
                                            <td style={{ padding: '9px 14px' }}>
                                                {c.periodLength ? (
                                                    <span className="chip chip-period">{c.periodLength}d</span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ padding: '9px 14px' }}>
                                                {cycleLen ? (
                                                    <span className={`chip ${cycleLen >= 21 && cycleLen <= 35 ? 'chip-regular' : 'chip-pms'}`}>{cycleLen}d</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>In progress</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.notes || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
