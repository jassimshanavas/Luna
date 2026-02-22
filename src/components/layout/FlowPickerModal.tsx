'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlowIntensity } from '@/context/AppContext';

const FLOWS: {
    key: FlowIntensity;
    label: string;
    desc: string;
    color: string;
    bg: string;
    dots: number;
}[] = [
        { key: 'spotting', label: 'Spotting', desc: 'Just a little — barely there', color: '#f9a8d4', bg: 'rgba(249,168,212,0.14)', dots: 1 },
        { key: 'light', label: 'Light', desc: 'Light — panty liner level', color: '#f472b6', bg: 'rgba(244,114,182,0.16)', dots: 2 },
        { key: 'medium', label: 'Medium', desc: 'Normal — regular pad/tampon', color: '#ec4899', bg: 'rgba(236,72,153,0.18)', dots: 3 },
        { key: 'heavy', label: 'Heavy', desc: 'Heavy — needs frequent changes', color: '#be185d', bg: 'rgba(190,24,93,0.18)', dots: 4 },
    ];

interface Props {
    date: string;
    onSelect: (flow: FlowIntensity) => void;
    onCancel: () => void;
}

export default function FlowPickerModal({ date, onSelect, onCancel }: Props) {
    // Portal: only runs client-side
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const d = new Date(date + 'T00:00:00');
    const isToday = date === new Date().toISOString().split('T')[0];
    const dateLabel = isToday
        ? 'Today'
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (!mounted) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            onClick={onCancel}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    padding: '28px 24px 20px',
                    width: '100%',
                    maxWidth: '360px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
                    border: '1px solid var(--border)',
                    animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                    <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🌹</div>
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.15rem', fontWeight: 700,
                        color: 'var(--text-primary)', marginBottom: '4px',
                    }}>
                        How's your flow?
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {dateLabel} · tap to select
                    </div>
                </div>

                {/* Flow options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
                    {FLOWS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => onSelect(f.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '13px 16px', borderRadius: '14px',
                                background: f.bg,
                                border: `1.5px solid ${f.color}55`,
                                cursor: 'pointer', transition: 'transform 0.15s ease',
                                textAlign: 'left', fontFamily: 'inherit', width: '100%',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            {/* Left colour strip */}
                            <div style={{
                                width: '4px', alignSelf: 'stretch', borderRadius: '9999px',
                                background: f.color, opacity: 0.75, flexShrink: 0,
                            }} />

                            {/* Text */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: f.color, fontSize: '0.9rem', marginBottom: '1px' }}>
                                    {f.label}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                    {f.desc}
                                </div>
                            </div>

                            {/* Dot intensity indicator */}
                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0 }}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: i < f.dots ? f.color : 'var(--bg-secondary)',
                                        border: i < f.dots ? 'none' : '1.5px solid var(--border)',
                                    }} />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Cancel */}
                <button
                    onClick={onCancel}
                    style={{
                        width: '100%', padding: '10px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-muted)', fontSize: '0.83rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        borderRadius: '10px', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    Cancel
                </button>
            </div>
        </div>,
        document.body   // ← renders outside all stacking contexts, guaranteed viewport coverage
    );
}
