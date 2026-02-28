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
    const { state, isLoaded } = useApp();
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const isAuthPage = pathname?.startsWith('/auth');
    const isOnboarding = pathname === '/onboarding';

    // Determine if we are still loading — cannot make any routing decision yet
    const isDeciding = !hydrated || loading || !isLoaded;

    // Detection: is this a 'suspected' existing user? 
    // If lastSignInTime is more than 30s after creationTime, they have almost certainly onboarded before.
    const creation = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
    const lastSign = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : 0;
    const isSuspectedExisting = user && (lastSign - creation > 30000); // 30s gap

    // Compute target redirect synchronously (null = no redirect needed / still deciding)
    let targetPath: string | null = null;
    if (!isDeciding) {
        if (!user && !isAuthPage) {
            targetPath = '/auth/login';
        } else if (user && isAuthPage) {
            targetPath = '/';
        } else if (user && !state.profile.onboardingComplete && !isOnboarding) {
            // SPECIAL GUARD: If we suspect they are an existing user but we have no onboarding data,
            // we should NOT redirect to onboarding yet. They might be waiting for a slow sync.
            // Only redirect to onboarding if it's a new account OR we are 100% sure we've reached Firestore.
            if (!isSuspectedExisting || (isLoaded && state.profile.name)) {
                targetPath = '/onboarding';
            }
        } else if (user && state.profile.onboardingComplete && isOnboarding) {
            targetPath = '/';
        }
    }

    // Fire the actual navigation
    useEffect(() => {
        if (targetPath) {
            router.replace(targetPath);
        }
    }, [targetPath, router]);

    // ── Show spinner while loading OR while a redirect is still pending ──
    // This prevents any flash of wrong content before the router redirect fires.
    if (isDeciding || targetPath !== null) {
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
    if (isAuthPage || isOnboarding) {
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
