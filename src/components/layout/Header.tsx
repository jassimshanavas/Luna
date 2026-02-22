'use client';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

const PAGE_TITLES: Record<string, { title: string; subtitle: string; emoji: string }> = {
    '/': { title: 'Dashboard', subtitle: 'Your daily cycle overview', emoji: '🏠' },
    '/calendar': { title: 'Calendar', subtitle: 'Track your cycle visually', emoji: '📅' },
    '/log': { title: 'Daily Log', subtitle: 'Record how you feel today', emoji: '✏️' },
    '/insights': { title: 'Insights', subtitle: 'Your patterns & analytics', emoji: '📊' },
    '/wellness': { title: 'Wellness Hub', subtitle: 'Mind, body & soul care', emoji: '💧' },
    '/ai': { title: 'AI Assistant', subtitle: 'Your personal cycle coach', emoji: '✨' },
    '/pregnancy': { title: 'Pregnancy Mode', subtitle: 'Your pregnancy journey', emoji: '🤰' },
    '/ttc': { title: 'TTC Mode', subtitle: 'Trying to conceive', emoji: '🌱' },
    '/settings': { title: 'Settings', subtitle: 'Personalize your experience', emoji: '⚙️' },
};

export default function Header() {
    const { state, dispatch, getDaysUntilPeriod } = useApp();
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const pageInfo = PAGE_TITLES[pathname] || { title: 'Luna', subtitle: '', emoji: '🌸' };
    const daysUntil = getDaysUntilPeriod();
    const today = new Date();

    if (pathname === '/onboarding') return null;

    const handleMenuClick = () => dispatch({ type: 'TOGGLE_SIDEBAR' });

    const handleThemeToggle = () => {
        dispatch({ type: 'SET_PROFILE', payload: { theme: state.profile.theme === 'light' ? 'dark' : 'light' } });
    };

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            gap: '12px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    className="btn btn-icon btn-ghost mobile-only"
                    onClick={handleMenuClick}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    id="menu-btn"
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }} className="desktop-only">{pageInfo.emoji}</span>
                        <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{pageInfo.title}</h1>
                    </div>
                    <p className="page-subtitle desktop-only">{pageInfo.subtitle}</p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Period Countdown */}
                <div className="desktop-only">
                    {daysUntil !== null && daysUntil > 0 && daysUntil <= 7 && (
                        <div className="chip chip-period" style={{ fontSize: '0.78rem' }}>
                            🌸 Period in {daysUntil}d
                        </div>
                    )}
                    {daysUntil !== null && daysUntil <= 0 && daysUntil > -7 && (
                        <div className="chip chip-period" style={{ fontSize: '0.78rem' }}>
                            🌹 Period day {Math.abs(daysUntil) + 1}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(12px)',
                    fontWeight: '500',
                }} className="desktop-only">
                    {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                {/* Theme Toggle */}
                <button
                    className="btn btn-icon btn-ghost"
                    onClick={handleThemeToggle}
                    style={{ width: '38px', height: '38px' }}
                    aria-label="Toggle theme"
                    title="Toggle dark mode"
                >
                    {state.profile.theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {/* Profile Avatar / Auth */}
                {!user ? (
                    <button
                        className="btn"
                        onClick={() => router.push('/auth/login')}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--grad-primary)',
                            color: 'white',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Sign In
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--grad-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            fontWeight: '700',
                            color: 'white',
                            flexShrink: 0,
                        }}
                            title={user.displayName || state.profile.name || 'User'}
                            onClick={() => {
                                if (confirm('Sign out of Luna?')) logout();
                            }}
                        >
                            {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || '🌸'}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

