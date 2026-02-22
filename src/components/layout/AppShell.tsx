'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from './Toast';
import MobileNav from './MobileNav';


export default function AppShell({ children }: { children: React.ReactNode }) {
    const { state } = useApp();
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [hydrated, setHydrated] = useState(false);

    // Wait for localStorage to hydrate before deciding to redirect
    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated || loading) return;

        const isAuthPage = pathname?.startsWith('/auth');
        const isOnboarding = pathname === '/onboarding';

        // Redirect to login if not authenticated and not on an auth page
        if (!user && !isAuthPage) {
            router.replace('/auth/login');
            return;
        }

        // Redirect to home if authenticated and on an auth page
        if (user && isAuthPage) {
            router.replace('/');
            return;
        }

        // Handle onboarding
        if (user && !state.profile.onboardingComplete && !isOnboarding) {
            router.replace('/onboarding');
        } else if (user && state.profile.onboardingComplete && isOnboarding) {
            router.replace('/');
        }
    }, [hydrated, loading, user, state.profile.onboardingComplete, pathname, router]);

    // Show blank screen while hydrating to avoid flash
    if (!hydrated) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', animation: 'breathe 2s ease-in-out infinite' }}>🌸</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-muted)', marginTop: '12px', fontSize: '1rem' }}>
                        Loading Luna...
                    </div>
                </div>
            </div>
        );
    }

    // Public pages — no sidebar/header
    if (pathname?.startsWith('/auth') || pathname === '/onboarding') {
        return (
            <>
                {children}
                <Toast />
            </>
        );
    }

    // Normal app shell
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Header />
                {children}
            </main>
            <MobileNav />
            <Toast />
        </div>
    );
}

