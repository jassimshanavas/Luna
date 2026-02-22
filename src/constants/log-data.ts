import { FlowIntensity, Mood } from '@/context/AppContext';

export const FLOW_OPTS: { key: FlowIntensity; label: string; desc: string; color: string; dots: number }[] = [
    { key: 'none', label: 'None', desc: 'No period today', color: '#94a3b8', dots: 0 },
    { key: 'spotting', label: 'Spotting', desc: 'Just a little — barely there', color: '#fda4af', dots: 1 },
    { key: 'light', label: 'Light', desc: 'Light — panty-liner level', color: '#fb7185', dots: 2 },
    { key: 'medium', label: 'Medium', desc: 'Normal — regular pad/tampon', color: '#f43f5e', dots: 3 },
    { key: 'heavy', label: 'Heavy', desc: 'Heavy — needs frequent changes', color: '#be123c', dots: 4 },
];

export const MOODS: { key: Mood; emoji: string; label: string; color: string }[] = [
    { key: 'happy', emoji: '😊', label: 'Happy', color: '#fbbf24' },
    { key: 'calm', emoji: '😌', label: 'Calm', color: '#34d399' },
    { key: 'energetic', emoji: '⚡', label: 'Energetic', color: '#fb923c' },
    { key: 'tired', emoji: '😴', label: 'Tired', color: '#818cf8' },
    { key: 'sad', emoji: '😢', label: 'Sad', color: '#60a5fa' },
    { key: 'anxious', emoji: '😰', label: 'Anxious', color: '#a78bfa' },
    { key: 'sensitive', emoji: '🥺', label: 'Sensitive', color: '#f472b6' },
    { key: 'angry', emoji: '😠', label: 'Angry', color: '#ef4444' },
];

export const PAIN_FACES = ['😊', '🙂', '😐', '😣', '😫', '😭'];
export const PAIN_LABELS = ['No pain', 'Mild', 'Moderate', 'Uncomfortable', 'Severe', 'Unbearable'];

export const BODY_REGIONS = [
    { id: 'head', label: 'Head', symptoms: ['Headache', 'Migraine'], cx: 50, cy: 18, rx: 14, ry: 15 },
    { id: 'chest', label: 'Chest', symptoms: ['Breast tenderness', 'Heart palpitations'], x: 27, y: 40, w: 46, h: 26, rx: 6 },
    { id: 'abdomen', label: 'Abdomen', symptoms: ['Bloating', 'Nausea', 'Cramps'], x: 27, y: 68, w: 46, h: 22, rx: 5 },
    { id: 'pelvis', label: 'Pelvis', symptoms: ['Cramps', 'Pelvic pain'], x: 25, y: 92, w: 50, h: 22, rx: 8 },
    { id: 'back', label: 'Back', symptoms: ['Back pain', 'Muscle aches'], x: 27, y: 92, w: 46, h: 22, rx: 5 },
    { id: 'legs', label: 'Legs', symptoms: ['Muscle aches', 'Water retention'], x: 27, y: 116, w: 46, h: 46, rx: 7 },
];
