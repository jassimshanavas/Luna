'use client';
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const { user } = useAuth();
  const isInitialLoad = useRef(true);
  const isSyncingFromRemote = useRef(false);

  // 1. Initial Load from LocalStorage (for guests) or Firestore (for users)
  useEffect(() => {
    if (!user) {
      // Local storage fallback for guests
      const saved = localStorage.getItem('luna_app_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'LOAD_STATE', payload: { ...defaultState, ...parsed, sidebarOpen: true, toast: null } });
        } catch { }
      }
      return;
    }

    // Load from Firestore for authenticated users
    const userDocRef = doc(db, 'users', user.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AppState>;
        isSyncingFromRemote.current = true;

        // Merge with defaultState to ensure all keys exist
        const mergedState: AppState = {
          ...defaultState,
          ...data,
          profile: {
            ...defaultState.profile,
            ...(data.profile || {})
          },
          sidebarOpen: state.sidebarOpen, // Preserve UI state
          toast: null
        };

        dispatch({ type: 'LOAD_STATE', payload: mergedState });
        setTimeout(() => { isSyncingFromRemote.current = false; }, 100);
      } else {
        // First time user: push current state
        setDoc(userDocRef, state);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Push state changes to Firestore or LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialLoad.current || isSyncingFromRemote.current) {
      isInitialLoad.current = false;
      return;
    }

    const { toast, sidebarOpen, ...toSave } = state;

    if (user) {
      // Sync to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, toSave, { merge: true }).catch(err => console.error("Firestore sync error:", err));
    } else {
      // Sync to LocalStorage for guests
      localStorage.setItem('luna_app_state', JSON.stringify(toSave));
    }
  }, [state, user]);

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
