'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_NAV_ITEMS = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/calendar', icon: '📅', label: 'Calendar' },
    { href: '/log', icon: '✏️', label: 'Log' },
    { href: '/ai', icon: '✨', label: 'Luna' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="mobile-nav">
            {MOBILE_NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}>
                    <div className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}>
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                </Link>
            ))}
        </nav>
    );
}
