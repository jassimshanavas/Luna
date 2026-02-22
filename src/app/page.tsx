'use client';
import { useApp, CyclePhase } from '@/context/AppContext';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import FlowPickerModal from '@/components/layout/FlowPickerModal';
import { MOODS } from '@/constants/log-data';

const PHASE_DETAILS: Record<CyclePhase, {
  title: string; emoji: string; gradient: string; tips: string[];
  energy: number; exercise: string; nutrition: string; mood: string;
}> = {
  period: {
    title: 'Menstrual Phase', emoji: '🌹', gradient: 'linear-gradient(135deg, #f9a8d4, #ec4899)',
    tips: ['Rest and be gentle with yourself', 'Warm baths help with cramps', 'Iron-rich foods like spinach help', 'Light walks can ease discomfort'],
    energy: 2, exercise: 'Gentle yoga & walks', nutrition: 'Iron-rich foods', mood: 'Restful',
  },
  follicular: {
    title: 'Follicular Phase', emoji: '🌱', gradient: 'linear-gradient(135deg, #6ee7b7, #34d399)',
    tips: ['Great time to start new projects!', 'Your energy is building — use it', 'Focus on high-protein foods', 'Try a new workout class'],
    energy: 4, exercise: 'HIIT & strength training', nutrition: 'Protein & complex carbs', mood: 'Energized',
  },
  ovulation: {
    title: 'Ovulation Phase', emoji: '🌟', gradient: 'linear-gradient(135deg, #fdba74, #fb923c)',
    tips: ['Peak energy — you\'re radiant!', 'Social & communicative phase', 'Fertile window is now', 'Great time for big decisions'],
    energy: 5, exercise: 'High-intensity cardio', nutrition: 'Antioxidant-rich foods', mood: 'Confident',
  },
  luteal: {
    title: 'Luteal Phase', emoji: '🌙', gradient: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
    tips: ['Energy starts to slow — honor it', 'Magnesium helps with PMS', 'Prioritize sleep quality', 'Journaling helps process emotions'],
    energy: 3, exercise: 'Moderate cardio & pilates', nutrition: 'Magnesium & B6 foods', mood: 'Reflective',
  },
  pms: {
    title: 'PMS Phase', emoji: '🫧', gradient: 'linear-gradient(135deg, #e879f9, #a855f7)',
    tips: ['Be extra kind to yourself', 'Avoid caffeine and salt', 'Dark chocolate can help!', 'Warm compresses for cramps'],
    energy: 2, exercise: 'Gentle yoga & stretching', nutrition: 'Avoid caffeine & salt', mood: 'Sensitive',
  },
  late: {
    title: 'Late Period', emoji: '⏰', gradient: 'linear-gradient(135deg, #fcd34d, #f97316)',
    tips: ['Stress is the #1 cause of late periods', 'Travel & time-zone changes can shift your cycle', 'Significant weight changes can delay flow', 'If over 7 days late, consider a pregnancy test'],
    energy: 2, exercise: 'Gentle walking & yoga', nutrition: 'Warm, nourishing foods', mood: 'Uncertain',
  },
  unknown: {
    title: 'Start Tracking', emoji: '💗', gradient: 'linear-gradient(135deg, #f9a8d4, #c084fc)',
    tips: ['Log your period to get started', 'Track daily to see patterns', 'Access AI insights after 1 cycle', 'Every cycle tells a story'],
    energy: 3, exercise: 'Any you enjoy!', nutrition: 'Balanced & nourishing', mood: 'Exploratory',
  },
};

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠', anxious: '😰',
  calm: '😌', energetic: '⚡', tired: '😴', sensitive: '🥺',
};

const QUICK_SYMPTOMS = ['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Nausea', 'Breast tenderness', 'Back pain', 'Mood swings'];

const AI_TIPS = [
  { phase: 'period' as CyclePhase, tip: "Your uterus is doing the hard work right now. Rest is productive.", tag: "Dr. Luna's Tip" },
  { phase: 'follicular' as CyclePhase, tip: "Estrogen rising! Channel this energy into creative and strategic tasks.", tag: "Dr. Luna's Tip" },
  { phase: 'ovulation' as CyclePhase, tip: "You're biologically at your most magnetic today. Own that energy! ✨", tag: "Dr. Luna's Tip" },
  { phase: 'luteal' as CyclePhase, tip: "This is a great time for deep, focused work. Your brain is wired for detail right now.", tag: "Dr. Luna's Tip" },
  { phase: 'pms' as CyclePhase, tip: "Your sensitivity now is a superpower — great for creative and emotional work.", tag: "Dr. Luna's Tip" },
  { phase: 'late' as CyclePhase, tip: "Late periods are very common — stress, sleep, and diet all play a role. Breathe, and track this cycle to improve predictions.", tag: "Dr. Luna's Tip" },
  { phase: 'unknown' as CyclePhase, tip: "Start by logging your last period date to unlock personalized insights!", tag: "Getting Started" },
];

function TodayReportCard({ log }: { log: any }) {
  const mood = log.mood || 'none';
  const flow = log.flow || 'none';
  const moodObj = MOODS.find((m: any) => m.key === mood);

  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const lastFetchedLog = useRef<string>('');

  useEffect(() => {
    const logKey = JSON.stringify(log);
    if (logKey === lastFetchedLog.current) return;

    // Check session storage cache first
    const cacheKey = `dashboard_narrative_${log.date || 'today'}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, key } = JSON.parse(cached);
      if (key === logKey) {
        setAiNarrative(data);
        lastFetchedLog.current = logKey;
        return;
      }
    }

    const fetchAiNarrative = async () => {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/ai/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: logKey,
        });
        const data = await res.json();
        if (data.narrative) {
          setAiNarrative(data.narrative);
          lastFetchedLog.current = logKey;
          // Cache the result
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: data.narrative, key: logKey }));
        }
      } catch (err) {
        console.error('Failed to fetch AI narrative', err);
      } finally {
        setIsGenerating(false);
      }
    };

    const timer = setTimeout(fetchAiNarrative, 1000); // 1s Debounce for dashboard
    return () => clearTimeout(timer);
  }, [log]);

  const localNarrative = `You felt ${moodObj?.label || 'neutral'} today. ${log.flow && log.flow !== 'none' ? `Your flow was ${log.flow}.` : ''} ${log.symptoms?.length > 0 ? `Logged ${log.symptoms.length} symptoms.` : ''}`;
  const displayNarrative = aiNarrative || localNarrative;

  return (
    <div className={`glass-card mood-glow-${mood}`} style={{
      padding: '24px',
      borderRadius: '24px',
      background: moodObj ? `linear-gradient(135deg, ${moodObj.color}10, transparent)` : 'var(--bg-card)',
    }}>
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title">
          <span className="section-title-icon">🎀</span>
          Today&apos;s Status
        </div>
        <span className="chip chip-regular" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>Tracked ✓</span>
      </div>

      <div className="today-report-grid" style={{ marginBottom: '20px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
          {moodObj?.emoji || '📋'}
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Feeling {moodObj?.label || 'Neutral'}</div>

          {/* AI Narrative */}
          <div style={{ marginBottom: '12px' }}>
            {isGenerating ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s infinite' }} />
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s 0.2s infinite' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.7 }}>Dr. Luna is writing...</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic', maxWidth: '90%' }}>
                &ldquo;{displayNarrative.replace(/\*\*/g, '')}&rdquo;
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Flow:</span>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i <= (flow === 'spotting' ? 1 : flow === 'light' ? 2 : flow === 'medium' ? 3 : flow === 'heavy' ? 4 : 0) ? '#f43f5e' : 'var(--border)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
            {(log.symptoms || []).slice(0, 3).map((s: string) => (
              <span key={s} style={{ padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>{s}</span>
            ))}
            {log.symptoms?.length > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>+{log.symptoms.length - 3}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[
          { icon: '😴', val: log.sleepHours || 0, max: 10, color: '#818cf8', label: 'Sleep' },
          { icon: '💧', val: log.waterIntake || 0, max: 8, color: '#60a5fa', label: 'Water' },
          { icon: '⚡', val: log.energyLevel || 3, max: 5, color: '#fb923c', label: 'Energy' }
        ].map((m, i) => {
          const r = 16, circ = 2 * Math.PI * r;
          const pct = Math.min((m.val / m.max) * 100, 100);
          return (
            <div key={i} style={{ flex: 1, padding: '12px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '36px', height: '36px', marginBottom: '6px' }}>
                <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="18" cy="18" r={r} fill="none" stroke={m.color} strokeWidth="3"
                    strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{m.val}<span style={{ opacity: 0.4, fontSize: '0.6rem' }}>/{m.max}</span></div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href="/log" style={{ flex: 1 }}>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>✏️ Edit Log</button>
        </Link>
        <Link href="/log" style={{ flex: 1 }}>
          <button className="btn btn-ghost" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>View Full →</button>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    state, getCurrentPhase, getCurrentCycleDay,
    getDaysUntilPeriod, getNextPeriodDate, startPeriod, endPeriod,
    getPeriodDays, showToast, dispatch, getDaysLate,
  } = useApp();

  const [currentTime, setCurrentTime] = useState('');
  const [quickMood, setQuickMood] = useState<string>('');
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showFlowPicker, setShowFlowPicker] = useState(false);

  const phase = getCurrentPhase();
  const cycleDay = getCurrentCycleDay();
  const daysUntil = getDaysUntilPeriod();
  const phaseInfo = PHASE_DETAILS[phase];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = state.logs.find(l => l.date === todayStr);
  const periodDays = getPeriodDays();
  const todayIsPeriod = periodDays.has(todayStr);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Show flow picker instead of calling startPeriod directly
  const handleStartPeriod = () => setShowFlowPicker(true);

  const handleQuickLog = () => {
    if (!quickMood && quickSymptoms.length === 0) {
      showToast('Select a mood or symptom to log', 'info');
      return;
    }
    dispatch({
      type: 'LOG_DAY', payload: {
        date: todayStr,
        mood: quickMood as any || undefined,
        symptoms: quickSymptoms,
      }
    });
    showToast('Quick log saved! 🌸', 'success');
    setQuickMood('');
    setQuickSymptoms([]);
  };

  const cycleProgress = Math.min((cycleDay / state.profile.averageCycleLength) * 100, 100);

  // Stats from recent data
  const recentLogs = state.logs.slice(-30);
  const avgSleep = recentLogs.filter(l => l.sleepHours).reduce((a, b) => a + (b.sleepHours || 0), 0) / Math.max(recentLogs.filter(l => l.sleepHours).length, 1);
  const avgWater = recentLogs.filter(l => l.waterIntake).reduce((a, b) => a + (b.waterIntake || 0), 0) / Math.max(recentLogs.filter(l => l.waterIntake).length, 1);

  const tip = AI_TIPS.find(t => t.phase === phase) || AI_TIPS[5];

  // ── Smart alert banner ────────────────────────────────────────────────────
  const alertBanner = (() => {
    if (phase === 'unknown') return null;
    // Late period — escalates based on days late
    if (phase === 'late') {
      const dl = getDaysLate();
      if (dl >= 7) return {
        emoji: '🤰',
        color: 'rgba(251,146,60,0.18)',
        border: 'rgba(251,146,60,0.55)',
        text: `Your period is ${dl} days late. It's worth taking a pregnancy test. If it comes back negative, speak to your doctor — thyroid issues, PCOS, or high stress can all delay your cycle significantly.`,
      };
      return {
        emoji: '⏰',
        color: 'rgba(251,191,36,0.14)',
        border: 'rgba(251,191,36,0.45)',
        text: `Your period is ${dl} day${dl !== 1 ? 's' : ''} late — this is very common! Stress, a change in sleep, or travel can shift your cycle by a few days. Tap "Period Arrived!" the moment it starts.`,
      };
    }
    if (daysUntil === 0) return { emoji: '🌹', color: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.4)', text: 'Your period is expected today! Stock up on pads/tampons and your heating pad. Be gentle with yourself 💗' };
    if (daysUntil === 1) return { emoji: '⚠️', color: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.35)', text: 'Period arriving tomorrow! Prep your hot water bottle, comfort snacks, and take it easy tonight.' };
    if (daysUntil !== null && daysUntil <= 3) return { emoji: '🫧', color: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: `Period in ${daysUntil} days. PMS peaks now — cut caffeine, increase magnesium, and prioritise sleep.` };
    if (phase === 'ovulation') return { emoji: '🌟', color: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', text: 'You are ovulating! This is your peak fertile window — highest energy, confidence, and libido. Own it! ✨' };
    if (phase === 'period' && todayIsPeriod) return { emoji: '🌹', color: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)', text: `Period Day ${cycleDay}. Rest, hydrate, and use a heating pad for cramps. Iron-rich foods will help you recover.` };
    if (phase === 'follicular' && cycleDay <= 8) return { emoji: '🌱', color: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: 'Your energy is building! Estrogen is rising — great time to start new projects or try a new workout.' };
    return null;
  })();

  // ── Upcoming events — current cycle first, then next cycle ───────────────
  const cycleLen = state.profile.averageCycleLength;
  const today = new Date();

  // Work out the start of the CURRENT cycle
  const lastCycleStart: Date | null = (() => {
    if (state.cycles.length > 0) {
      return new Date(state.cycles[state.cycles.length - 1].startDate + 'T00:00:00');
    }
    if (state.profile.lastPeriodStart) {
      return new Date(state.profile.lastPeriodStart + 'T00:00:00');
    }
    return null;
  })();

  // Current-cycle key dates
  const currentCycleOv = lastCycleStart ? new Date(lastCycleStart.getTime() + (cycleLen - 14) * 86400000) : null;
  const currentCycleFWStart = currentCycleOv ? new Date(currentCycleOv.getTime() - 5 * 86400000) : null;
  const currentCycleFWEnd = currentCycleOv ? new Date(currentCycleOv.getTime() + 1 * 86400000) : null;

  // Next-cycle key dates (from predicted next period)
  const nextPeriodDate = getNextPeriodDate();
  const nextOv = nextPeriodDate ? new Date(nextPeriodDate.getTime() + (cycleLen - 14) * 86400000) : null;
  const nextFWStart = nextOv ? new Date(nextOv.getTime() - 5 * 86400000) : null;

  // Decide which fertile window and ovulation to surface
  // If today is PAST the current-cycle fertile window end, show NEXT cycle
  const showNextCycleFW = currentCycleFWEnd ? today > currentCycleFWEnd : true;

  const fertileWindowDate = showNextCycleFW ? nextFWStart : currentCycleFWStart;
  const ovulationDate = showNextCycleFW ? nextOv : currentCycleOv;

  const daysTo = (d: Date | null) => d ? Math.round((d.getTime() - today.getTime()) / 86400000) : null;
  const daysToFW = daysTo(fertileWindowDate);
  const daysToOv = daysTo(ovulationDate);

  return (
    <div className="animate-fade-in">
      {/* Flow Picker Modal */}
      {showFlowPicker && (
        <FlowPickerModal
          date={todayStr}
          onSelect={(flow) => {
            startPeriod(todayStr, flow);
            showToast(`Period started — ${flow} flow 🌹 Take care of yourself.`, 'success');
            setShowFlowPicker(false);
            setConfetti(true);
            setTimeout(() => setConfetti(false), 3000);
          }}
          onCancel={() => setShowFlowPicker(false)}
        />
      )}
      {/* Confetti */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#f472b6', '#a78bfa', '#fb923c', '#34d399'][i % 4],
                width: `${Math.random() * 10 + 6}px`,
                height: `${Math.random() * 10 + 6}px`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Hero: Phase Card ── */}
      <div className="card stagger-children animate-fade-in" style={{
        background: phaseInfo.gradient,
        border: 'none',
        marginBottom: '20px',
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
        padding: '22px',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', left: '-20px', bottom: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        {/* Top row: phase info + compact ring */}
        <div className="dash-hero-row" style={{ position: 'relative', zIndex: 1, marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.8rem', animation: 'float 3s ease-in-out infinite' }}>{phaseInfo.emoji}</span>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>{phaseInfo.title}</div>
                <div style={{ fontSize: '1.9rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, lineHeight: 1.05 }}>Day {cycleDay}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.88rem', opacity: 0.9, marginBottom: '14px', lineHeight: 1.4 }}>
              {phase === 'late'
                ? `⏰ Period is ${getDaysLate()} day${getDaysLate() !== 1 ? 's' : ''} late`
                : daysUntil !== null
                  ? daysUntil > 0
                    ? `Next period in ${daysUntil} days`
                    : daysUntil === 0
                      ? 'Period expected today!'
                      : `Period day ${cycleDay}`
                  : 'Log your period to start predictions'
              }
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!todayIsPeriod ? (
                <button className="btn btn-sm" style={{
                  background: phase === 'late' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)',
                  color: 'white', backdropFilter: 'blur(8px)',
                  border: `1px solid ${phase === 'late' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}`,
                  fontWeight: phase === 'late' ? 800 : 600,
                  borderRadius: '12px',
                }}
                  onClick={handleStartPeriod}>
                  {phase === 'late' ? '🌹 Period Arrived!' : '🌹 Start Period'}
                </button>
              ) : (
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px' }}
                  onClick={() => endPeriod(todayStr)}>
                  ✓ End Period
                </button>
              )}
              <Link href="/log">
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px' }}>
                  ✏️ Log Today
                </button>
              </Link>
            </div>
          </div>

          {/* Responsive Cycle Ring — desktop: 120px, mobile: 90px */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {/* Desktop ring (120px) */}
            <div className="dash-ring-desktop" style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none"
                  stroke="white" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - cycleProgress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{Math.round(cycleProgress)}%</div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cycle</div>
              </div>
            </div>
            {/* Mobile ring (90px) */}
            <div className="dash-ring-mobile" style={{ position: 'relative', width: '90px', height: '90px' }}>
              <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="45" cy="45" r="36" fill="none"
                  stroke="white" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - cycleProgress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{Math.round(cycleProgress)}%</div>
                <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Cycle</div>
              </div>
            </div>
            <div className="dash-hero-ring-sub" style={{ color: 'rgba(255,255,255,0.85)' }}>{state.profile.averageCycleLength}d cycle</div>
          </div>
        </div>

        {/* Tip */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 14px', position: 'relative', zIndex: 1, backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: '3px' }}>✨ {tip.tag}</div>
          <div style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>{tip.tip}</div>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {alertBanner && !bannerDismissed && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '14px 18px', borderRadius: '14px', marginBottom: '20px',
          background: alertBanner.color,
          border: `1px solid ${alertBanner.border}`,
          animation: 'slideInRight 0.35s ease-out',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{alertBanner.emoji}</span>
          <div style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {alertBanner.text}
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
            id="dismiss-banner-btn"
            title="Dismiss"
          >✕</button>
        </div>
      )}

      {/* ── Quick Stats ── */}
      <div className="dash-stats stagger-children">
        {[
          { icon: '🗓️', value: `${state.cycles.length}`, label: 'Cycles Tracked', color: 'var(--primary)' },
          { icon: '⏱️', value: `${state.profile.averageCycleLength}d`, label: 'Avg Cycle', color: 'var(--secondary)' },
          { icon: '😴', value: avgSleep > 0 ? `${avgSleep.toFixed(1)}h` : '—', label: 'Avg Sleep', color: '#818cf8' },
          { icon: '💧', value: avgWater > 0 ? `${avgWater.toFixed(1)}` : '—', label: 'Avg Water', color: '#60a5fa' },
        ].map((stat, i) => (
          <div key={i} className="card card-sm animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="dash-stat-icon">{stat.icon}</div>
            <div className="dash-stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="dash-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="dash-content-grid">

        {/* Quick Log / Today's Report */}
        {todayLog ? (
          <TodayReportCard log={todayLog} />
        ) : (
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                <span className="section-title-icon">⚡</span>
                Quick Log
              </div>
              <span className="chip chip-period">Not logged</span>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>How are you feeling?</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'happy', emoji: '😊' }, { key: 'calm', emoji: '😌' },
                  { key: 'tired', emoji: '😴' }, { key: 'sad', emoji: '😢' },
                  { key: 'anxious', emoji: '😰' }, { key: 'sensitive', emoji: '🥺' },
                  { key: 'energetic', emoji: '⚡' }, { key: 'angry', emoji: '😠' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setQuickMood(quickMood === m.key ? '' : m.key)}
                    style={{
                      width: '46px', height: '46px', borderRadius: '14px', fontSize: '1.4rem',
                      border: `2px solid ${quickMood === m.key ? 'var(--primary)' : 'var(--border)'}`,
                      background: quickMood === m.key ? 'rgba(244,114,182,0.12)' : 'var(--bg-secondary)',
                      cursor: 'pointer', transition: 'all 0.18s',
                      transform: quickMood === m.key ? 'scale(1.15)' : 'scale(1)',
                    }}
                    aria-label={m.key}
                  >{m.emoji}</button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>Any symptoms?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {QUICK_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuickSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    style={{
                      padding: '7px 13px', borderRadius: '9999px', fontSize: '0.78rem', fontFamily: 'inherit',
                      fontWeight: quickSymptoms.includes(s) ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: quickSymptoms.includes(s) ? 'rgba(244,114,182,0.15)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${quickSymptoms.includes(s) ? 'var(--primary)' : 'var(--border)'}`,
                      color: quickSymptoms.includes(s) ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1, height: '48px', borderRadius: '14px' }} onClick={handleQuickLog}>🌸 Save Log</button>
              <Link href="/log" style={{ flex: 1 }}>
                <button className="btn btn-ghost" style={{ width: '100%', height: '48px', borderRadius: '14px' }}>Full Log →</button>
              </Link>
            </div>
          </div>
        )}

        {/* Phase Tips */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <span className="section-title-icon">💡</span>
              Phase Guidance
            </div>
            <span className="chip chip-period">{phaseInfo.title.split(' ')[0]}</span>
          </div>

          {/* Energy Level */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>⚡ Energy Level</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{phaseInfo.energy}/5</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${phaseInfo.energy * 20}%` }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(244,114,182,0.08)', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Exercise</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>{phaseInfo.exercise}</div>
            </div>
            <div style={{ background: 'rgba(167,139,250,0.08)', borderRadius: '10px', padding: '10px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Nutrition</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>{phaseInfo.nutrition}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {phaseInfo.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>❖</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cycle Progress ── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="section-header">
          <div className="section-title">
            <span className="section-title-icon">📈</span>
            Cycle Progress
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Day {cycleDay} of {state.profile.averageCycleLength}</span>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <div className="progress-bar" style={{ height: '10px', borderRadius: '9999px' }}>
            <div className="progress-fill" style={{ width: `${cycleProgress}%`, borderRadius: '9999px' }} />
          </div>
          {/* Phase markers */}
          {[
            { percent: 0, emoji: '🌹', label: 'Period' },
            { percent: (state.profile.averagePeriodLength / state.profile.averageCycleLength) * 100, emoji: '🌱', label: 'Follicular' },
            { percent: ((state.profile.averageCycleLength - 14) / state.profile.averageCycleLength) * 100, emoji: '🌟', label: 'Ovulation' },
            { percent: ((state.profile.averageCycleLength - 7) / state.profile.averageCycleLength) * 100, emoji: '🪷', label: 'PMS' },
          ].map((marker, i) => (
            <div key={i} style={{ position: 'absolute', top: '-3px', left: `${marker.percent}%`, transform: 'translateX(-50%)' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'var(--bg-card)',
                border: `2px solid ${i === Math.floor(cycleProgress / 25) ? 'var(--primary)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px',
              }}>{marker.emoji}</div>
              {/* Label below */}
              <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{marker.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="section-header">
          <div className="section-title">
            <span className="section-title-icon">📅</span>
            Upcoming
          </div>
          <Link href="/calendar">
            <button className="btn btn-ghost btn-sm">Calendar →</button>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {([
            {
              label: 'Next Period',
              date: nextPeriodDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Log a period to predict',
              emoji: '🌹',
              color: 'rgba(244,114,182,0.12)',
              border: 'rgba(244,114,182,0.3)',
              days: daysUntil,
              badge: daysUntil !== null && daysUntil <= 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : null,
            },
            {
              label: fertileWindowDate
                ? (showNextCycleFW ? 'Fertile Window (next)' : daysToFW !== null && daysToFW < 0 ? 'Fertile Window ✓' : 'Fertile Window')
                : 'Fertile Window',
              date: fertileWindowDate
                ? fertileWindowDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not tracked yet',
              emoji: '🌿',
              color: daysToFW !== null && daysToFW < 0 ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.12)',
              border: daysToFW !== null && daysToFW < 0 ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.3)',
              days: daysToFW,
              badge: daysToFW !== null && daysToFW === 0 ? 'Today!' : null,
            },
            {
              label: ovulationDate
                ? (showNextCycleFW ? 'Ovulation (next)' : daysToOv !== null && daysToOv < 0 ? 'Ovulation ✓' : 'Ovulation Day')
                : 'Ovulation Day',
              date: ovulationDate
                ? ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not tracked yet',
              emoji: '🌟',
              color: daysToOv !== null && daysToOv < 0 ? 'rgba(251,146,60,0.06)' : 'rgba(251,146,60,0.12)',
              border: daysToOv !== null && daysToOv < 0 ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.35)',
              days: daysToOv,
              badge: daysToOv !== null && daysToOv === 0 ? 'Today!' : null,
            },
          ] as const).map((event, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: '12px',
              background: event.color, border: `1px solid ${event.border}`,
              opacity: event.days !== null && event.days < -3 ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{event.emoji}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{event.label}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px' }}>{event.date}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {event.badge && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', background: 'var(--grad-rose)', padding: '2px 8px', borderRadius: '9999px', marginBottom: '2px', whiteSpace: 'nowrap' }}>
                    {event.badge}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: event.days !== null && event.days <= 0 ? '#059669' : 'var(--text-muted)' }}>
                  {event.days === null ? '—'
                    : event.days < 0 ? `${Math.abs(event.days)}d ago`
                      : event.days === 0 ? 'Today'
                        : `in ${event.days}d`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Logs ── */}
      {state.logs.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <span className="section-title-icon">📋</span>
              Recent Logs
            </div>
            <Link href="/log">
              <button className="btn btn-ghost btn-sm">See All</button>
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.logs.slice(-5).reverse().map((log, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(244,114,182,0.05)',
                border: '1px solid var(--border)',
                fontSize: '0.84rem',
              }}>
                <span style={{ fontSize: '1rem' }}>
                  {log.mood ? MOOD_EMOJIS[log.mood] || '📋' : '📋'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {[log.flow && log.flow !== 'none' ? `Flow: ${log.flow}` : '', log.mood, ...(log.symptoms || []).slice(0, 2)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {log.flow && log.flow !== 'none' && (
                  <div className={`chip chip-period`} style={{ fontSize: '0.7rem' }}>🌹 {log.flow}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
