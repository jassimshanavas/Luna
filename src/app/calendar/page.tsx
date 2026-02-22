'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import FlowPickerModal from '@/components/layout/FlowPickerModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

type DayType = 'period' | 'late-expected' | 'predicted' | 'fertile' | 'ovulation' | 'pms' | null;

interface DayInfo {
    date: Date;
    dateStr: string;
    type: DayType;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasLog: boolean;
    log?: any;
    flow?: string;
    isPast: boolean;
}

// Flow → background intensity
const FLOW_BG: Record<string, string> = {
    spotting: 'rgba(244,114,182,0.18)',
    light: 'rgba(244,114,182,0.30)',
    medium: 'rgba(244,114,182,0.52)',
    heavy: 'rgba(236,72,153,0.72)',
    none: 'transparent',
};
const FLOW_LABEL: Record<string, string> = {
    spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy',
};

export default function CalendarPage() {
    const {
        state, getPeriodDays, getFertileDays, getOvulationDay, getPMSDays,
        getNextPeriodDate, startPeriod, endPeriod, showToast, getCurrentPhase, getDaysLate,
    } = useApp();

    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
    const [flowPickerDate, setFlowPickerDate] = useState<string | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const periodDays = getPeriodDays();
    const fertileDays = getFertileDays();
    const ovulationDay = getOvulationDay();
    const pmsDays = getPMSDays();
    const nextPeriod = getNextPeriodDate();
    const phase = getCurrentPhase();
    const daysLate = getDaysLate();

    // Late-expected days: predicted date(s) that have passed without a logged period
    const lateExpectedDays = useMemo(() => {
        const set = new Set<string>();
        if (phase !== 'late' || !nextPeriod) return set;
        // Mark each day from predicted start up to and including today
        const cursor = new Date(nextPeriod);
        const today = new Date(todayStr + 'T00:00:00');
        while (cursor <= today) {
            const s = cursor.toISOString().split('T')[0];
            if (!periodDays.has(s)) set.add(s);
            cursor.setDate(cursor.getDate() + 1);
        }
        return set;
    }, [phase, nextPeriod, todayStr, periodDays]);

    // Predicted future period days (only future dates)
    const predictedDays = useMemo(() => {
        const set = new Set<string>();
        if (!nextPeriod) return set;
        for (let i = 0; i < state.profile.averagePeriodLength; i++) {
            const d = new Date(nextPeriod.getTime() + i * 86400000);
            const dStr = d.toISOString().split('T')[0];
            if (!periodDays.has(dStr) && dStr > todayStr) set.add(dStr);
        }
        return set;
    }, [nextPeriod, state.profile.averagePeriodLength, periodDays, todayStr]);

    const getDayType = (dateStr: string): DayType => {
        if (periodDays.has(dateStr)) return 'period';
        if (lateExpectedDays.has(dateStr)) return 'late-expected';
        if (predictedDays.has(dateStr)) return 'predicted';
        if (dateStr === ovulationDay) return 'ovulation';
        if (fertileDays.has(dateStr)) return 'fertile';
        if (pmsDays.has(dateStr)) return 'pms';
        return null;
    };

    const buildMonthDays = (): DayInfo[] => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();
        const cells: DayInfo[] = [];

        const push = (d: Date) => {
            const dStr = d.toISOString().split('T')[0];
            const log = state.logs.find(l => l.date === dStr);
            cells.push({
                date: d, dateStr: dStr,
                type: getDayType(dStr),
                isCurrentMonth: d.getMonth() === month,
                isToday: dStr === todayStr,
                hasLog: !!log,
                log,
                flow: log?.flow,
                isPast: dStr < todayStr,
            });
        };

        for (let i = firstDay - 1; i >= 0; i--)
            push(new Date(year, month - 1, daysInPrev - i));
        for (let i = 1; i <= daysInMonth; i++)
            push(new Date(year, month, i));
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++)
            push(new Date(year, month + 1, i));

        return cells;
    };

    const days = buildMonthDays();

    const prev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const next = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const goToday = () => setViewDate(new Date());

    // ── Per-cell style ────────────────────────────────────────────────────────
    const getCellStyle = (day: DayInfo): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'relative',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            width: '100%', aspectRatio: '1',
            borderRadius: '12px',
            cursor: 'pointer',
            border: '1.5px solid transparent',
            fontSize: '0.88rem', fontWeight: 500,
            transition: 'all 0.18s ease',
            opacity: day.isCurrentMonth ? 1 : 0.35,
            background: 'transparent',
        };

        if (!day.isCurrentMonth) return base;

        switch (day.type) {
            case 'period':
                return {
                    ...base,
                    background: FLOW_BG[day.flow || 'medium'],
                    border: '1.5px solid rgba(236,72,153,0.35)',
                    color: day.flow === 'heavy' ? '#fff' : 'var(--text-primary)',
                    fontWeight: 700,
                };
            case 'late-expected':
                return {
                    ...base,
                    background: 'rgba(251,191,36,0.15)',
                    border: '1.5px dashed rgba(251,146,60,0.6)',
                    color: '#d97706',
                    fontWeight: 700,
                };
            case 'predicted':
                return {
                    ...base,
                    background: 'rgba(244,114,182,0.07)',
                    border: '1.5px dashed rgba(244,114,182,0.4)',
                };
            case 'ovulation':
                return {
                    ...base,
                    background: 'rgba(251,146,60,0.22)',
                    border: '1.5px solid rgba(251,146,60,0.55)',
                    fontWeight: 700,
                };
            case 'fertile':
                return {
                    ...base,
                    background: 'rgba(52,211,153,0.14)',
                    border: '1.5px solid rgba(52,211,153,0.35)',
                };
            case 'pms':
                return {
                    ...base,
                    background: 'rgba(167,139,250,0.14)',
                    border: '1.5px solid rgba(167,139,250,0.3)',
                };
        }

        return base;
    };

    const getTodayRing = (day: DayInfo): React.CSSProperties =>
        day.isToday ? {
            outline: `2.5px solid var(--primary)`,
            outlineOffset: '2px',
            borderRadius: '12px',
        } : {};

    const selectedRing = (day: DayInfo): React.CSSProperties =>
        selectedDay?.dateStr === day.dateStr ? {
            outline: '2.5px solid var(--accent)',
            outlineOffset: '2px',
            borderRadius: '12px',
        } : {};

    const typeLabel: Record<string, string> = {
        period: '🌹 Period', 'late-expected': '⏰ Late Period',
        predicted: '🔮 Predicted', fertile: '🌿 Fertile Window',
        ovulation: '🌟 Ovulation Day', pms: '🫧 PMS Zone',
    };

    const LEGEND = [
        { color: 'rgba(236,72,153,0.55)', border: 'rgba(236,72,153,0.4)', label: 'Period (Heavy)', dashed: false, emoji: '🌹' },
        { color: 'rgba(244,114,182,0.30)', border: 'rgba(244,114,182,0.4)', label: 'Period (Light)', dashed: false, emoji: '🩸' },
        { color: 'rgba(251,191,36,0.18)', border: 'rgba(251,146,60,0.6)', label: 'Late / Overdue', dashed: true, emoji: '⏰' },
        { color: 'rgba(244,114,182,0.07)', border: 'rgba(244,114,182,0.4)', label: 'Predicted Period', dashed: true, emoji: '🔮' },
        { color: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.35)', label: 'Fertile Window', dashed: false, emoji: '🌿' },
        { color: 'rgba(251,146,60,0.22)', border: 'rgba(251,146,60,0.55)', label: 'Ovulation', dashed: false, emoji: '🌟' },
        { color: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.3)', label: 'PMS Zone', dashed: false, emoji: '🫧' },
    ];

    // Cycle stats
    const allCycles = state.cycles;
    const avgCycleLen = allCycles.length > 1
        ? allCycles.slice(0, -1).reduce((sum, c, i) => {
            const nxt = allCycles[i + 1];
            return sum + Math.round((new Date(nxt.startDate).getTime() - new Date(c.startDate).getTime()) / 86400000);
        }, 0) / (allCycles.length - 1)
        : state.profile.averageCycleLength;

    // Mini timeline: last cycle's current day position
    const lastCycleStart = allCycles.length > 0
        ? new Date(allCycles[allCycles.length - 1].startDate + 'T00:00:00') : null;
    const cycleDay = lastCycleStart
        ? Math.min(
            Math.floor((new Date(todayStr + 'T00:00:00').getTime() - lastCycleStart.getTime()) / 86400000) + 1,
            Math.round(avgCycleLen) + 14
        )
        : null;
    const cyclePct = cycleDay ? Math.min((cycleDay / Math.round(avgCycleLen)) * 100, 100) : 0;

    return (
        <div className="animate-fade-in">

            {/* Flow Picker Modal */}
            {flowPickerDate && (
                <FlowPickerModal
                    date={flowPickerDate}
                    onSelect={(flow) => {
                        startPeriod(flowPickerDate, flow);
                        showToast(`Period marked for ${new Date(flowPickerDate + 'T00:00:00').toLocaleDateString()} — ${flow} flow 🌹`, 'success');
                        setFlowPickerDate(null);
                        setSelectedDay(null);
                    }}
                    onCancel={() => setFlowPickerDate(null)}
                />
            )}

            {/* ── Late Period Banner ─────────────────────────────────────────── */}
            {phase === 'late' && (
                <div style={{
                    marginBottom: '16px', padding: '14px 18px',
                    background: 'rgba(251,191,36,0.13)',
                    border: '1.5px dashed rgba(251,146,60,0.5)',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{ fontSize: '1.6rem', animation: 'breathe 2s ease-in-out infinite' }}>⏰</span>
                    <div>
                        <div style={{ fontWeight: 700, color: '#d97706', fontSize: '0.9rem', marginBottom: '2px' }}>
                            Period is {daysLate} day{daysLate !== 1 ? 's' : ''} late
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Amber-outlined dates show the overdue window. Tap a day and press "🌹 Mark Period" when it starts.
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header Actions ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                <button
                    className="btn btn-sm"
                    onClick={goToday}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 14px' }}
                >
                    Today
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <div className="chip chip-sm" style={{ background: 'rgba(236,72,153,0.1)', color: '#db2777', border: 'none', fontSize: '0.65rem' }}>🌹 Logged</div>
                    <div className="chip chip-sm desktop-only" style={{ background: 'rgba(52,211,153,0.1)', color: '#059669', border: 'none', fontSize: '0.65rem' }}>🌿 Fertile</div>
                </div>
            </div>

            <div className="page-layout-grid">

                {/* ── Calendar ────────────────────────────────────────────────── */}
                <div className="card">
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <button className="btn btn-icon btn-ghost" onClick={prev} aria-label="Previous month" style={{ width: '38px', height: '38px' }}>←</button>
                        <h2 className="month-nav-title">
                            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </h2>
                        <button className="btn btn-icon btn-ghost" onClick={next} aria-label="Next month" style={{ width: '38px', height: '38px' }}>→</button>
                    </div>

                    {/* Mini cycle timeline */}
                    {cycleDay !== null && (
                        <div style={{ marginBottom: '18px', padding: '12px 14px', background: 'rgba(244,114,182,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                <span>🌹 Period</span><span>🌱 Follicular</span><span>🌟 Ovulation</span><span>🌙 Luteal / PMS</span>
                            </div>
                            <div style={{ position: 'relative', height: '10px', borderRadius: '9999px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                                {/* Phase colour bands */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(236,72,153,0.5) 0%, rgba(236,72,153,0.5) 14%, rgba(52,211,153,0.4) 14%, rgba(52,211,153,0.4) 45%, rgba(251,146,60,0.5) 45%, rgba(251,146,60,0.5) 55%, rgba(167,139,250,0.4) 55%, rgba(167,139,250,0.4) 80%, rgba(192,132,252,0.5) 80%, rgba(192,132,252,0.5) 100%)' }} />
                                {/* Current day marker */}
                                <div style={{
                                    position: 'absolute', top: '-2px', bottom: '-2px',
                                    left: `${Math.min(cyclePct, 100)}%`, transform: 'translateX(-50%)',
                                    width: '4px', background: 'white', borderRadius: '9999px',
                                    boxShadow: '0 0 0 2px var(--primary)',
                                    zIndex: 2,
                                }} />
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Day {cycleDay} of {Math.round(avgCycleLen)}</span>
                                {phase === 'late' && <span style={{ color: '#d97706', fontWeight: 800 }}>! OVERDUE</span>}
                            </div>
                        </div>
                    )}

                    {/* Day headers */}
                    <div className="calendar-grid" style={{ marginBottom: '8px' }}>
                        {DAYS.map(d => <div key={d} className="calendar-header-day">{d}</div>)}
                    </div>

                    {/* Day cells */}
                    <div className="calendar-grid">
                        {days.map((day, i) => {
                            const cellStyle = { ...getCellStyle(day), ...getTodayRing(day), ...selectedRing(day) };
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDay(selectedDay?.dateStr === day.dateStr ? null : day)}
                                    style={cellStyle}
                                    aria-label={`${day.date.toDateString()}${day.type ? `, ${day.type}` : ''}`}
                                >
                                    {/* Date number */}
                                    <span style={{ lineHeight: 1, fontSize: day.isToday ? '0.95rem' : '0.88rem', fontWeight: day.isToday ? 800 : 500 }}>
                                        {day.date.getDate()}
                                    </span>

                                    {/* Type emoji badge (top-right corner) */}
                                    {day.isCurrentMonth && day.type && (
                                        <span style={{
                                            position: 'absolute', top: '2px', right: '3px',
                                            fontSize: '7px', lineHeight: 1,
                                        }}>
                                            {{
                                                'period': '🌹',
                                                'late-expected': '⏰',
                                                'predicted': '🔮',
                                                'fertile': '🌿',
                                                'ovulation': '🌟',
                                                'pms': '🫧',
                                            }[day.type]}
                                        </span>
                                    )}

                                    {/* Flow intensity dot (bottom) */}
                                    {day.flow && day.flow !== 'none' && (
                                        <span style={{
                                            position: 'absolute', bottom: '3px',
                                            display: 'flex', gap: '1px',
                                        }}>
                                            {Array.from({
                                                length:
                                                    day.flow === 'spotting' ? 1 :
                                                        day.flow === 'light' ? 1 :
                                                            day.flow === 'medium' ? 2 : 3
                                            }).map((_, j) => (
                                                <span key={j} style={{
                                                    width: '3px', height: '3px', borderRadius: '50%',
                                                    background: day.flow === 'heavy' ? 'rgba(255,255,255,0.9)' : 'rgba(236,72,153,0.8)',
                                                    display: 'block',
                                                }} />
                                            ))}
                                        </span>
                                    )}

                                    {/* Log dot (has any log) */}
                                    {day.hasLog && !day.flow && (
                                        <span style={{
                                            position: 'absolute', bottom: '3px',
                                            width: '3px', height: '3px', borderRadius: '50%',
                                            background: 'var(--text-muted)',
                                            display: 'block',
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend (Mobile Only - Collapsed layout) */}
                    <div className="mobile-only" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                            {LEGEND.slice(0, 4).map(l => (
                                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.color, border: `1px solid ${l.border}` }} />
                                    {l.emoji}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend (Desktop) */}
                    <div className="desktop-only" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Legend</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                            {LEGEND.map(l => (
                                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <div style={{
                                        width: '16px', height: '16px', borderRadius: '5px',
                                        background: l.color,
                                        border: `1.5px ${l.dashed ? 'dashed' : 'solid'} ${l.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '8px',
                                    }}>{l.emoji}</div>
                                    {l.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ─────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Selected day detail */}
                    {selectedDay ? (
                        <div className="card animate-scale">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                    {selectedDay.type && (
                                        <div style={{
                                            display: 'inline-block', marginTop: '6px', padding: '3px 10px',
                                            borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
                                            background: {
                                                'period': 'rgba(236,72,153,0.15)',
                                                'late-expected': 'rgba(251,191,36,0.2)',
                                                'predicted': 'rgba(244,114,182,0.1)',
                                                'fertile': 'rgba(52,211,153,0.15)',
                                                'ovulation': 'rgba(251,146,60,0.15)',
                                                'pms': 'rgba(167,139,250,0.15)',
                                            }[selectedDay.type] ?? 'transparent',
                                            color: {
                                                'period': '#db2777',
                                                'late-expected': '#d97706',
                                                'predicted': '#db2777',
                                                'fertile': '#059669',
                                                'ovulation': '#ea580c',
                                                'pms': '#7c3aed',
                                            }[selectedDay.type] ?? 'var(--text-primary)',
                                        }}>
                                            {typeLabel[selectedDay.type]}
                                        </div>
                                    )}
                                    {selectedDay.flow && selectedDay.flow !== 'none' && (
                                        <div style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Flow: <strong>{FLOW_LABEL[selectedDay.flow] ?? selectedDay.flow}</strong>
                                        </div>
                                    )}
                                </div>
                                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedDay(null)}>✕</button>
                            </div>

                            {selectedDay.log ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedDay.log.mood && (
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.84rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Mood:</span>
                                            <span>{({ happy: '😊', sad: '😢', angry: '😠', anxious: '😰', calm: '😌', energetic: '⚡', tired: '😴', sensitive: '🥺' } as Record<string, string>)[selectedDay.log.mood as string] ?? ''} {selectedDay.log.mood}</span>
                                        </div>
                                    )}
                                    {selectedDay.log.symptoms?.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Symptoms</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {selectedDay.log.symptoms.map((s: string) => (
                                                    <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(244,114,182,0.1)', color: 'var(--primary)', border: '1px solid rgba(244,114,182,0.3)' }}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedDay.log.notes && (
                                        <div style={{ padding: '8px 10px', background: 'rgba(244,114,182,0.06)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            📝 {selectedDay.log.notes}
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {selectedDay.log.sleepHours && <span>😴 {selectedDay.log.sleepHours}h sleep</span>}
                                        {selectedDay.log.waterIntake && <span>💧 {selectedDay.log.waterIntake} glasses</span>}
                                        {selectedDay.log.temperature && <span>🌡️ {selectedDay.log.temperature}°C</span>}
                                        {selectedDay.log.weight && <span>⚖️ {selectedDay.log.weight}kg</span>}
                                        {selectedDay.log.energyLevel && <span>⚡ Energy {selectedDay.log.energyLevel}/5</span>}
                                        {selectedDay.log.painLevel && <span>💊 Pain {selectedDay.log.painLevel}/5</span>}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    {selectedDay.type === 'late-expected'
                                        ? '⏰ Period was expected here — tap "Mark Period" when it starts'
                                        : selectedDay.type === 'predicted'
                                            ? '🔮 Predicted period day — no log yet'
                                            : '📋 No log for this day'}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <Link href={`/log?date=${selectedDay.dateStr}`} style={{ flex: 1 }}>
                                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                                        {selectedDay.log ? '✏️ Edit Log' : '+ Add Log'}
                                    </button>
                                </Link>
                                {!selectedDay.log?.flow && selectedDay.type !== 'predicted' && (
                                    <button className="btn btn-ghost btn-sm"
                                        onClick={() => setFlowPickerDate(selectedDay.dateStr)}>
                                        🌹 Mark Period
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Click any date to view details &amp; logs</div>
                        </div>
                    )}

                    {/* Upcoming key dates */}
                    <div className="card">
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">🗓️</span>
                            Key Dates This Cycle
                        </div>
                        {[
                            nextPeriod && {
                                label: phase === 'late' ? '⏰ Period (Overdue)' : '🌹 Next Period',
                                date: nextPeriod,
                                color: phase === 'late' ? '#d97706' : '#db2777',
                                bg: phase === 'late' ? 'rgba(251,191,36,0.1)' : 'rgba(236,72,153,0.07)',
                            },
                            getOvulationDay() && {
                                label: '🌟 Ovulation',
                                date: new Date(getOvulationDay() + 'T00:00:00'),
                                color: '#ea580c',
                                bg: 'rgba(251,146,60,0.07)',
                            },
                        ].filter(Boolean).map((item: any, i) => {
                            const isPast = item.date < new Date();
                            const diff = Math.round((item.date.getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000);
                            return (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', borderRadius: '10px', background: item.bg,
                                    marginBottom: '8px',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color }}>{item.label}</div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isPast ? '#d97706' : 'var(--text-muted)' }}>
                                        {diff === 0 ? 'Today' : diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cycle Stats */}
                    <div className="card">
                        <div className="section-title" style={{ marginBottom: '14px' }}>
                            <span className="section-title-icon">📊</span>
                            Cycle Stats
                        </div>
                        {[
                            { label: 'Avg Cycle', value: `${Math.round(avgCycleLen)}d`, icon: '🔄' },
                            { label: 'Period Length', value: `${state.profile.averagePeriodLength}d`, icon: '🌹' },
                            { label: 'Cycles Logged', value: state.cycles.length.toString(), icon: '📈' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                    <span>{s.icon}</span>{s.label}
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Mobile optimized Actions Grid */}
                    <div className="grid-2 mobile-only">
                        <button className="btn btn-primary btn-sm" onClick={() => setFlowPickerDate(todayStr)} style={{ height: '54px', borderRadius: '16px' }}>
                            🌹 {phase === 'late' ? 'Period Arrived!' : 'Report Start'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { endPeriod(todayStr); showToast('Period ended today', 'info'); }} style={{ height: '54px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            🌹 Report End
                        </button>
                    </div>

                    {/* Desktop only Actions */}
                    <div className="card desktop-only" style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(167,139,250,0.08))', borderColor: 'rgba(244,114,182,0.2)' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>🌹 Period Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setFlowPickerDate(todayStr)}>
                                {phase === 'late' ? '🌹 Period Arrived Today!' : 'Start Period Today'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { endPeriod(todayStr); showToast('Period ended today', 'info'); }}>
                                End Period Today
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

