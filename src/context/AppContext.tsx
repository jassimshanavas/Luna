'use client';
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'none';
export type Mood = 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'energetic' | 'tired' | 'sensitive';
export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal' | 'pms' | 'late' | 'unknown';
export type AIModel = { name: string; version: string; label: string; color: string; speed: number; quality: number; tag: string; };

export interface DayLog {
  date: string; // ISO date string YYYY-MM-DD
  flow?: FlowIntensity;
  mood?: Mood;
  symptoms: string[];
  notes?: string;
  temperature?: number; // BBT in Celsius
  weight?: number;
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  waterIntake?: number; // glasses
  energyLevel?: number; // 1-5
  painLevel?: number; // 0-5
  sexualActivity?: boolean;
  pillTaken?: boolean;
  isIntimate?: boolean;
}

export interface PeriodCycle {
  id: string;
  startDate: string;
  endDate?: string;
  cycleLength?: number; // calculated from next period start
  periodLength?: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  age?: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart?: string;
  nextPeriodPredicted?: string;
  trackingGoal: 'general' | 'ttc' | 'avoid' | 'health';
  birthControlMethod?: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  reminderDays: number;
  pronouns?: string;
  onboardingComplete: boolean;
  aiModel?: string; // model name
}

export interface AppState {
  profile: UserProfile;
  cycles: PeriodCycle[];
  logs: DayLog[];
  activeDate: string;
  sidebarOpen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

type Action =
  | { type: 'SET_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_CYCLE'; payload: PeriodCycle }
  | { type: 'UPDATE_CYCLE'; payload: { id: string; data: Partial<PeriodCycle> } }
  | { type: 'LOG_DAY'; payload: DayLog }
  | { type: 'UPDATE_LOG'; payload: { date: string; data: Partial<DayLog> } }
  | { type: 'SET_ACTIVE_DATE'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'HIDE_TOAST' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'LOAD_STATE'; payload: AppState };

// ─── Initial State ─────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

const defaultState: AppState = {
  profile: {
    name: '',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStart: undefined,
    trackingGoal: 'general',
    theme: 'light',
    notifications: true,
    reminderDays: 3,
    onboardingComplete: false,
    aiModel: 'gemini-flash-latest',
  },
  cycles: [],
  logs: [],
  activeDate: today,
  sidebarOpen: true,
  toast: null,
};

// ─── Reducer ───────────────────────────────────────────────
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'ADD_CYCLE':
      return { ...state, cycles: [...state.cycles, action.payload] };

    case 'UPDATE_CYCLE':
      return {
        ...state,
        cycles: state.cycles.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c
        )
      };

    case 'LOG_DAY': {
      const existing = state.logs.findIndex(l => l.date === action.payload.date);
      if (existing >= 0) {
        const newLogs = [...state.logs];
        newLogs[existing] = { ...newLogs[existing], ...action.payload };
        return { ...state, logs: newLogs };
      }
      return { ...state, logs: [...state.logs, action.payload] };
    }

    case 'UPDATE_LOG':
      return {
        ...state,
        logs: state.logs.map(l =>
          l.date === action.payload.date ? { ...l, ...action.payload.data } : l
        )
      };

    case 'SET_ACTIVE_DATE':
      return { ...state, activeDate: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'COMPLETE_ONBOARDING':
      return { ...state, profile: { ...state.profile, onboardingComplete: true } };

    case 'LOAD_STATE':
      return { ...action.payload, profile: { ...defaultState.profile, ...action.payload.profile } };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  startPeriod: (date: string, flow?: FlowIntensity) => void;
  endPeriod: (date: string) => void;
  logDay: (log: DayLog) => void;
  getPeriodDays: () => Set<string>;
  getFertileDays: () => Set<string>;
  getOvulationDay: () => string | null;
  getPMSDays: () => Set<string>;
  getCurrentPhase: () => CyclePhase;
  getCurrentCycleDay: () => number;
  getNextPeriodDate: () => Date | null;
  getDaysUntilPeriod: () => number | null;
  getDaysLate: () => number;
  getDayLog: (date: string) => DayLog | undefined;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isLoaded: boolean;
  loadedFor: string | null; // UID of the user this state belongs to, or 'guest'
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const { user, loading: authLoading } = useAuth();
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const isSyncingFromRemote = useRef(false);
  const isLoaded = !!loadedFor; // Helper for compatibility

  // 1. Initial Load from LocalStorage (for guests) or Firestore (for users)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (loadedFor === 'guest') return; // Already guest-loaded

      // Local storage fallback for guests
      const saved = localStorage.getItem('luna_app_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'LOAD_STATE', payload: { ...defaultState, ...parsed, sidebarOpen: true, toast: null } });
        } catch { /* ignore parse errors */ }
      }
      setLoadedFor('guest');
      return;
    }

    // ── Authenticated user loading strategy ──────────────────
    // Reset loading state and clear data from previous (guest) session
    if (loadedFor !== user.uid) {
      setLoadedFor(null); // Kill the old 'Ready' flag instantly
      dispatch({ type: 'LOAD_STATE', payload: defaultState });
    }

    const userKey = `luna_app_state_${user.uid}`;
    const userDocRef = doc(db, 'users', user.uid);

    // Helper to parse and normalize any saved state (handles old flat format too)
    const parseAndNormalize = (raw: string): Partial<AppState> | null => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(raw) as any;
        return {
          ...data,
          profile: {
            ...defaultState.profile,
            ...(data.profile || {}),
            // Old format: onboardingComplete was at the root level
            ...(data.onboardingComplete !== undefined ? { onboardingComplete: data.onboardingComplete } : {}),
          },
        };
      } catch { return null; }
    };

    // Helper: merge Firestore data into state, NEVER downgrading onboardingComplete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFirestoreData = (rawData: any, protectOnboarding: boolean) => {
      // Normalization: old Firestore data had fields at root level. 
      // New format has a nested 'profile' object.
      const { isLoaded: _il, sidebarOpen: _sb, toast: _t, ...clean } = rawData;

      // Extract profile: prefer nested profile, but fall back to root-level legacy fields
      const incomingProfile = {
        ...(clean.profile || {}),
        // Legacy fallbacks (only used if nested profile doesn't have them)
        ...(clean.name !== undefined && !clean.profile?.name ? { name: clean.name } : {}),
        ...(clean.onboardingComplete !== undefined && clean.profile?.onboardingComplete === undefined ? { onboardingComplete: clean.onboardingComplete } : {}),
        ...(clean.averageCycleLength !== undefined && !clean.profile?.averageCycleLength ? { averageCycleLength: clean.averageCycleLength } : {}),
      };

      const firestoreOnboarded: boolean = incomingProfile.onboardingComplete === true;

      // DETECTION: even if flag is false, if they have a name, cycles, or logs, 
      // they have clearly used the app before. We should treat them as onboarded.
      const hasEvidenceOfUse = Boolean(
        (incomingProfile.name && incomingProfile.name.trim() !== "") ||
        (clean.cycles && clean.cycles.length > 0) ||
        (clean.logs && clean.logs.length > 0)
      );

      // If we know the user is onboarded (local cache OR evidence) but Firestore says false → it's corrupted data.
      const finalOnboarded = firestoreOnboarded || protectOnboarding || hasEvidenceOfUse;

      if (!firestoreOnboarded && (protectOnboarding || hasEvidenceOfUse)) {
        console.warn('[Luna] Detected onboarded user with missing completion flag — repairing...');
        // Repair: write the correct value back to Firestore in the NEW format
        setDoc(userDocRef, { profile: { ...incomingProfile, onboardingComplete: true } }, { merge: true })
          .catch(e => console.warn('[Luna] Firestore repair failed:', e.message));
      }

      const mergedState: AppState = {
        ...defaultState,
        ...clean,
        profile: {
          ...defaultState.profile,
          ...incomingProfile,
          onboardingComplete: finalOnboarded,
        },
        sidebarOpen: true,
        toast: null,
      };
      isSyncingFromRemote.current = true;
      dispatch({ type: 'LOAD_STATE', payload: mergedState });
      setLoadedFor(user.uid);
      setTimeout(() => { isSyncingFromRemote.current = false; }, 100);
    };

    // Step 1: Instantly load from per-user localStorage cache (on same device)
    const newRaw = localStorage.getItem(userKey);
    const oldRaw = localStorage.getItem('luna_app_state');
    const newParsed = newRaw ? parseAndNormalize(newRaw) : null;
    const oldParsed = oldRaw ? parseAndNormalize(oldRaw) : null;

    // Prefer whichever local source has onboardingComplete=true
    const bestLocal =
      (oldParsed?.profile as any)?.onboardingComplete ? oldParsed :
        (newParsed?.profile as any)?.onboardingComplete ? newParsed :
          newParsed || oldParsed;

    if (bestLocal) {
      dispatch({ type: 'LOAD_STATE', payload: { ...defaultState, ...bestLocal, sidebarOpen: true, toast: null } });
      setLoadedFor(user.uid); // Unblock UI instantly from cache
    }

    // Whether local data definitively says this user is onboarded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localSaysOnboarded = (bestLocal?.profile as any)?.onboardingComplete === true;

    // Step 2: getDoc — simple HTTP fetch, works even when onSnapshot (WebSocket) fails.
    // This is the primary source of truth for new/different devices.
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          // Pass localSaysOnboarded so corrupted Firestore data can never override local truth
          applyFirestoreData(docSnap.data(), localSaysOnboarded);
          // Update local cache — preserve the corrected onboardingComplete
          const { toast: _t, sidebarOpen: _s, isLoaded: _il, ...toCache } = docSnap.data() as any;
          const corrected = {
            ...toCache,
            profile: {
              ...defaultState.profile,
              ...(toCache.profile || {}),
              onboardingComplete: (toCache.profile?.onboardingComplete === true) || localSaysOnboarded,
            },
          };
          localStorage.setItem(userKey, JSON.stringify(corrected));
        } else if (!bestLocal) {
          // Brand new user, no doc and no local cache
          setLoadedFor(user.uid);
        }
      })
      .catch((err) => {
        console.warn('[Luna] getDoc failed:', err.message);
        if (!bestLocal) setLoadedFor(user.uid);
      });

    // Step 3: onSnapshot — real-time updates only (skip first event, handled by getDoc)
    let snapshotSkipFirst = true;
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (snapshotSkipFirst) { snapshotSkipFirst = false; return; }
        if (docSnap.exists()) applyFirestoreData(docSnap.data(), localSaysOnboarded);
      },
      (err) => { console.warn('[Luna] onSnapshot (non-critical):', err.message); }
    );

    // Step 4: Safety timeout
    const waitTime = bestLocal ? 8000 : 15000;
    const timeoutId = setTimeout(() => {
      console.warn(`[Luna] Firestore timed out — unblocking UI for ${user.uid}`);
      setLoadedFor(user.uid);
    }, waitTime);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user, authLoading, loadedFor]); // Added loadedFor to trigger reset if identity drifts

  // 2. Push state changes to Firestore or LocalStorage
  //    Guard: only sync AFTER initial load is complete, and never while syncing from remote.
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded || isSyncingFromRemote.current) return;

    // Only sync meaningful state — never anything that shouldn't persist
    const { toast, sidebarOpen, ...toSave } = state;

    if (user) {
      // Always write to per-user localStorage cache for instant loads on refresh
      const userKey = `luna_app_state_${user.uid}`;
      localStorage.setItem(userKey, JSON.stringify(toSave));
      // Also sync to Firestore in background
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, toSave, { merge: true }).catch(err => console.error("Firestore sync error:", err));
    } else {
      // Sync to LocalStorage for guests
      localStorage.setItem('luna_app_state', JSON.stringify(toSave));
    }
  }, [state, user, isLoaded]);

  // Apply theme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', state.profile.theme);
  }, [state.profile.theme]);

  // ─── Helper Methods ──────────────────────────────────────

  const getPeriodDays = (): Set<string> => {
    const days = new Set<string>();
    state.cycles.forEach(cycle => {
      if (!cycle.startDate) return;
      const start = new Date(cycle.startDate);
      const periodLen = cycle.periodLength || state.profile.averagePeriodLength;
      const end = cycle.endDate ? new Date(cycle.endDate) : new Date(start.getTime() + (periodLen - 1) * 86400000);
      let cur = new Date(start);
      while (cur <= end) {
        days.add(cur.toISOString().split('T')[0]);
        cur = new Date(cur.getTime() + 86400000);
      }
    });
    // Also log-based period days
    state.logs.forEach(log => {
      if (log.flow && log.flow !== 'none') days.add(log.date);
    });
    return days;
  };

  const getNextPeriodDate = (): Date | null => {
    if (!state.profile.lastPeriodStart && state.cycles.length === 0) return null;
    const lastStart = state.cycles.length > 0
      ? new Date(state.cycles[state.cycles.length - 1].startDate)
      : state.profile.lastPeriodStart ? new Date(state.profile.lastPeriodStart) : null;
    if (!lastStart) return null;
    return new Date(lastStart.getTime() + state.profile.averageCycleLength * 86400000);
  };

  const getCurrentCycleDay = (): number => {
    const lastStart = state.cycles.length > 0
      ? new Date(state.cycles[state.cycles.length - 1].startDate)
      : state.profile.lastPeriodStart ? new Date(state.profile.lastPeriodStart) : null;
    if (!lastStart) return 1;
    const todayDate = new Date(today);
    const diff = Math.floor((todayDate.getTime() - lastStart.getTime()) / 86400000);
    const cycleLen = state.profile.averageCycleLength;
    // If past the expected period date and no period logged today:
    // show the ACTUAL day count (Day 29, 30...) instead of wrapping to Day 1
    // so the UI can say "Day 30 of your 28-day cycle" rather than incorrectly "Day 2"
    if (diff >= cycleLen) {
      const periodDays = getPeriodDays();
      if (!periodDays.has(today)) return diff + 1;
    }
    return Math.max(1, (diff % cycleLen) + 1);
  };

  const getFertileDays = (): Set<string> => {
    const days = new Set<string>();
    const nextPeriod = getNextPeriodDate();
    if (!nextPeriod) return days;
    // Fertile window: 5 days before ovulation (which is ~14 days before next period)
    const ovulation = new Date(nextPeriod.getTime() - 14 * 86400000);
    for (let i = -5; i <= 1; i++) {
      const d = new Date(ovulation.getTime() + i * 86400000);
      days.add(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getOvulationDay = (): string | null => {
    const nextPeriod = getNextPeriodDate();
    if (!nextPeriod) return null;
    const ovulation = new Date(nextPeriod.getTime() - 14 * 86400000);
    return ovulation.toISOString().split('T')[0];
  };

  const getPMSDays = (): Set<string> => {
    const days = new Set<string>();
    const nextPeriod = getNextPeriodDate();
    if (!nextPeriod) return days;
    // PMS: 7-14 days before period
    for (let i = 1; i <= 7; i++) {
      const d = new Date(nextPeriod.getTime() - i * 86400000);
      days.add(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getCurrentPhase = (): CyclePhase => {
    // No data at all
    if (!state.profile.lastPeriodStart && state.cycles.length === 0) return 'unknown';

    const lastStart = state.cycles.length > 0
      ? new Date(state.cycles[state.cycles.length - 1].startDate)
      : state.profile.lastPeriodStart ? new Date(state.profile.lastPeriodStart) : null;
    if (!lastStart) return 'unknown';

    const todayDate = new Date(today);
    const diff = Math.floor((todayDate.getTime() - lastStart.getTime()) / 86400000);
    const cycleLen = state.profile.averageCycleLength;

    // Late period: past expected start date, no flow logged today
    if (diff >= cycleLen) {
      const periodDays = getPeriodDays();
      if (!periodDays.has(today)) return 'late';
    }

    // Normal phase calc using wrapped cycle day
    const cycleDay = Math.max(1, (diff % cycleLen) + 1);
    const periodLen = state.profile.averagePeriodLength;
    const ovDay = Math.round(cycleLen - 14);

    if (cycleDay <= periodLen) return 'period';
    if (cycleDay <= ovDay - 2) return 'follicular';
    if (cycleDay === ovDay - 1 || cycleDay === ovDay || cycleDay === ovDay + 1) return 'ovulation';
    if (cycleDay <= cycleLen - 7) return 'luteal';
    return 'pms';
  };

  const getDaysUntilPeriod = (): number | null => {
    const next = getNextPeriodDate();
    if (!next) return null;
    const todayDate = new Date(today);
    const diff = Math.ceil((next.getTime() - todayDate.getTime()) / 86400000);
    return diff;
  };

  // Returns how many days PAST the predicted period date (0 if not late)
  const getDaysLate = (): number => {
    const next = getNextPeriodDate();
    if (!next) return 0;
    const todayDate = new Date(today);
    const diff = Math.floor((todayDate.getTime() - next.getTime()) / 86400000);
    return Math.max(0, diff);
  };

  const startPeriod = (date: string, flow: FlowIntensity = 'medium') => {
    const newCycle: PeriodCycle = {
      id: `cycle_${Date.now()}`,
      startDate: date,
    };
    dispatch({ type: 'ADD_CYCLE', payload: newCycle });
    dispatch({ type: 'SET_PROFILE', payload: { lastPeriodStart: date } });
    const existingLog = state.logs.find(l => l.date === date);
    if (existingLog) {
      dispatch({ type: 'UPDATE_LOG', payload: { date, data: { flow } } });
    } else {
      dispatch({ type: 'LOG_DAY', payload: { date, flow, symptoms: [] } });
    }
  };

  const endPeriod = (date: string) => {
    if (state.cycles.length === 0) return;
    const lastCycle = state.cycles[state.cycles.length - 1];
    dispatch({
      type: 'UPDATE_CYCLE',
      payload: {
        id: lastCycle.id,
        data: {
          endDate: date,
          periodLength: Math.ceil(
            (new Date(date).getTime() - new Date(lastCycle.startDate).getTime()) / 86400000
          ) + 1
        }
      }
    });
    showToast('Period ended. You made it! 💪', 'info');
  };

  const logDay = (log: DayLog) => {
    dispatch({ type: 'LOG_DAY', payload: log });
  };

  const getDayLog = (date: string): DayLog | undefined => {
    return state.logs.find(l => l.date === date);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3500);
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      startPeriod,
      endPeriod,
      logDay,
      getPeriodDays,
      getFertileDays,
      getOvulationDay,
      getPMSDays,
      getCurrentPhase,
      getCurrentCycleDay,
      getNextPeriodDate,
      getDaysUntilPeriod,
      getDaysLate,
      getDayLog,
      showToast,
      isLoaded,
      loadedFor,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
