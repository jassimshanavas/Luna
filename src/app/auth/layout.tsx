
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.5s ease',
        }}>
            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}>
                {/* Animated Pink Orb */}
                <motion.div
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        right: '-15%',
                        width: '60%',
                        height: '60%',
                        background: 'rgba(244, 114, 182, 0.12)',
                        borderRadius: '50%',
                        filter: 'blur(120px)',
                    }}
                />

                {/* Animated Purple Orb */}
                <motion.div
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 60, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        left: '-10%',
                        width: '70%',
                        height: '70%',
                        background: 'rgba(167, 139, 250, 0.1)',
                        borderRadius: '50%',
                        filter: 'blur(140px)',
                    }}
                />

                {/* Animated Peach Orb */}
                <motion.div
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 40, 0],
                        scale: [1, 0.9, 1],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '-5%',
                        width: '40%',
                        height: '40%',
                        background: 'rgba(251, 146, 60, 0.08)',
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />

                {/* Floating Stars/Dots */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0.1, scale: 0.5 }}
                        animate={{
                            opacity: [0.1, 0.5, 0.1],
                            scale: [0.5, 1, 0.5],
                            y: [0, -100, 0]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 10,
                        }}
                        style={{
                            position: 'absolute',
                            width: '4px',
                            height: '4px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: 0.3,
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key="auth-content"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        maxWidth: '440px',
                        zIndex: 10,
                        position: 'relative',
                    }}
                >
                    {children}

                    <div style={{
                        marginTop: '32px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            {[0.4, 0.6, 0.4].map((op, idx) => (
                                <span key={idx} style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    opacity: op
                                }} />
                            ))}
                        </div>
                        <p style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            color: 'var(--primary)',
                            fontWeight: 800,
                            opacity: 0.6,
                            fontFamily: 'inherit'
                        }}>
                            Your Rhythm • Your Choice • Your Luna
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
