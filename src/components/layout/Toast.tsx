'use client';
import { useApp } from '@/context/AppContext';

export default function Toast() {
    const { state } = useApp();
    const { toast } = state;

    if (!toast) return null;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const colors = {
        success: 'rgba(52, 211, 153, 0.15)',
        error: 'rgba(244, 63, 94, 0.15)',
        info: 'rgba(167, 139, 250, 0.15)',
    };

    return (
        <div className="toast-container">
            <div className="toast" style={{ background: colors[toast.type] }}>
                <span>{icons[toast.type]}</span>
                <span>{toast.message}</span>
            </div>
        </div>
    );
}
