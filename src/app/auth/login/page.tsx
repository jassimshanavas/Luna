
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Mail, Lock, Chrome, ArrowRight, Loader2, Moon } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-xl)',
                padding: '40px',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative inner elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '32px',
                opacity: 0.1,
                pointerEvents: 'none',
            }}>
                <Moon size={100} color="var(--primary)" style={{ transform: 'rotate(12deg)' }} />
            </div>

            <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--grad-primary)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: 'var(--shadow-lg)',
                    transform: 'rotate(3deg)',
                }}>
                    <Moon size={40} color="white" />
                </div>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    margin: 0
                }}>
                    Luna <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Companion</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
                    Welcome back to your rhythm.
                </p>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--danger)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        marginBottom: '24px',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)' }} />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginLeft: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Mail style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            width: '20px',
                            height: '20px'
                        }} />
                        <input
                            type="email"
                            placeholder="hello@luna.com"
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                background: 'rgba(0,0,0,0.03)',
                                border: '2px solid transparent',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '16px',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                            }}
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px' }}>
                        <label style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Password
                        </label>
                        <Link href="#" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Forgot?</Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            width: '20px',
                            height: '20px'
                        }} />
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                background: 'rgba(0,0,0,0.03)',
                                border: '2px solid transparent',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '16px',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                            }}
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </motion.div>

                <motion.button
                    variants={itemVariants}
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: '100%',
                        background: 'var(--grad-rose)',
                        color: 'white',
                        fontWeight: 700,
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '16px',
                        marginTop: '8px',
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            Sign Into Luna
                            <ArrowRight size={20} />
                        </>
                    )}
                </motion.button>
            </form>

            <motion.div variants={itemVariants} style={{ position: 'relative', margin: '32px 0' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid var(--border)' }}></div>
                </div>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>
                    <span style={{ padding: '0 16px', background: 'transparent', color: 'var(--text-muted)' }}>Celestial Sync</span>
                </div>
            </motion.div>

            <motion.button
                variants={itemVariants}
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    fontSize: '15px',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer'
                }}
            >
                <Chrome size={20} color="#ea4335" />
                Continue with Google
            </motion.button>

            <motion.p variants={itemVariants} style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                New to the rhythm?{' '}
                <Link href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                    Join Luna Free
                </Link>
            </motion.p>

            <style jsx>{`
        .auth-input:focus {
          background: white !important;
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 4px rgba(244, 114, 182, 0.1) !important;
        }
      `}</style>
        </motion.div>
    );
}
