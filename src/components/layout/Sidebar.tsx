'use client';
import { useApp, CyclePhase } from '@/context/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/', icon: '🏠', label: 'Dashboard', section: 'main' },
    { href: '/calendar', icon: '📅', label: 'Calendar', section: 'main' },
    { href: '/log', icon: '✏️', label: 'Log Today', section: 'main', badge: 'Log' },
    { href: '/insights', icon: '📊', label: 'Insights', section: 'main' },
    { href: '/wellness', icon: '💧', label: 'Wellness Hub', section: 'main' },
    { href: '/ai', icon: '✨', label: 'AI Assistant', section: 'tools', badge: 'AI' },
    { href: '/pregnancy', icon: '🤰', label: 'Pregnancy Mode', section: 'tools' },
    { href: '/ttc', icon: '🌱', label: 'TTC Mode', section: 'tools' },
    { href: '/settings', icon: '⚙️', label: 'Settings', section: 'account' },
];

const PHASE_INFO: Record<CyclePhase, { label: string; color: string; emoji: string }> = {
    period: { label: 'Period', color: '#f472b6', emoji: '🌹' },
    follicular: { label: 'Follicular', color: '#34d399', emoji: '🌱' },
    ovulation: { label: 'Ovulation', color: '#fb923c', emoji: '🌟' },
    luteal: { label: 'Luteal', color: '#a78bfa', emoji: '🌙' },
    pms: { label: 'PMS Zone', color: '#c084fc', emoji: '🫧' },
    late: { label: 'Period Late', color: '#f97316', emoji: '⏰' },
    unknown: { label: 'Track Now', color: '#f472b6', emoji: '💗' },
};

export default function Sidebar() {
    const { state, getCurrentPhase, getCurrentCycleDay, dispatch } = useApp();
    const pathname = usePathname();
    const phase = getCurrentPhase();
    const cycleDay = getCurrentCycleDay();
    const phaseInfo = PHASE_INFO[phase];

    const handleLinkClick = () => {
        if (window.innerWidth <= 1024) {
            dispatch({ type: 'SET_SIDEBAR', payload: false });
        }
    };

    // Don't show sidebar on onboarding
    if (pathname === '/onboarding') return null;

    return (
        <>
            {/* Improved Overlay for mobile */}
            <div
                className={`sidebar-overlay ${state.sidebarOpen ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
            />

            <aside className={`sidebar ${state.sidebarOpen ? 'open' : ''}`}>
                {/* Logo Section */}
                <div className="sidebar-logo">
                    <div className="logo-mark" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="logo-icon" style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}>🌸</div>
                            <div>
                                <div className="logo-text" style={{ fontSize: '1.2rem' }}><span>Luna</span></div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0' }}>Cycle Companion</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-icon btn-ghost mobile-only"
                            onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
                            style={{
                                width: '36px',
                                height: '36px',
                                background: 'rgba(244, 114, 182, 0.08)',
                                border: '1px solid var(--border)',
                                fontSize: '0.9rem',
                                color: 'var(--primary)'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Phase Status Card */}
                <div style={{ padding: '16px 16px 4px' }}>
                    <div className="card card-sm" style={{
                        background: `rgba(${phase === 'period' ? '244,114,182' : phase === 'ovulation' ? '251,146,60' : phase === 'follicular' ? '52,211,153' : '167,139,250'}, 0.08)`,
                        borderColor: `${phaseInfo.color}22`,
                        padding: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.6rem' }}>{phaseInfo.emoji}</span>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day {cycleDay} • {phaseInfo.label}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: phaseInfo.color, lineHeight: 1.2 }}>Rhythm Status</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav" style={{ padding: '12px 16px' }}>
                    {/* Main section */}
                    <div className="nav-section-title" style={{ paddingLeft: '8px' }}>Main</div>
                    {NAV_ITEMS.filter(i => i.section === 'main').map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            style={{
                                animation: state.sidebarOpen ? `fadeInLeft 0.3s ease forwards ${0.1 + idx * 0.04}s` : 'none',
                                opacity: state.sidebarOpen ? 0 : 1,
                                display: 'block'
                            }}
                        >
                            <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                                <div className="nav-icon">{item.icon}</div>
                                <span>{item.label}</span>
                                {item.badge && pathname !== item.href && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </div>
                        </Link>
                    ))}

                    <div className="nav-section-title" style={{ paddingLeft: '8px', marginTop: '16px' }}>Personal AI & Tools</div>
                    {NAV_ITEMS.filter(i => i.section === 'tools').map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            style={{
                                animation: state.sidebarOpen ? `fadeInLeft 0.3s ease forwards ${0.3 + idx * 0.04}s` : 'none',
                                opacity: state.sidebarOpen ? 0 : 1,
                                display: 'block'
                            }}
                        >
                            <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                                <div className="nav-icon">{item.icon}</div>
                                <span>{item.label}</span>
                                {item.badge && pathname !== item.href && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </div>
                        </Link>
                    ))}

                    <div className="nav-section-title" style={{ paddingLeft: '8px', marginTop: '16px' }}>Account</div>
                    {NAV_ITEMS.filter(i => i.section === 'account').map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            style={{
                                animation: state.sidebarOpen ? `fadeInLeft 0.3s ease forwards ${0.5 + idx * 0.04}s` : 'none',
                                opacity: state.sidebarOpen ? 0 : 1,
                                display: 'block'
                            }}
                        >
                            <div className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                                <div className="nav-icon">{item.icon}</div>
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1rem', color: 'var(--primary)', opacity: 0.8 }}>
                            "Know your rhythm, ♡
                        </div>
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1rem', color: 'var(--primary)', opacity: 0.8 }}>
                            live your best days"
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
