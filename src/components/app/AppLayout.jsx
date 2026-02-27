import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import GlobalAI from './GlobalAI';
import ParticleCanvas from '../ParticleCanvas';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import '../../App.css';

// Subtle grid + ambient orbs (remain as before for performance)
function AmbientOrbs() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(124,58,237,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.022) 1px, transparent 1px)',
                backgroundSize: '72px 72px',
            }} />
            {/* Violet orb */}
            <motion.div
                animate={{ x: [0, 25, 0], y: [0, -18, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '-12%', left: '-8%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 70%)', filter: 'blur(50px)' }}
            />
            {/* Cyan orb */}
            <motion.div
                animate={{ x: [0, -20, 0], y: [0, 22, 0], scale: [1, 1.09, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
                style={{ position: 'absolute', bottom: '-18%', right: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,229,255,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            {/* Pink accent */}
            <motion.div
                animate={{ x: [0, 18, -12, 0], y: [0, -12, 16, 0], scale: [1, 1.04, 0.97, 1] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
                style={{ position: 'absolute', top: '38%', left: '43%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,121,249,0.055) 0%, transparent 70%)', filter: 'blur(70px)' }}
            />
        </div>
    );
}

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .maybeSingle();
            if (!error && data && data.onboarding_completed === false) {
                navigate('/app/onboarding', { replace: true });
            }
        })();
    }, [user, navigate]);

    // Close mobile sidebar when clicking backdrop
    const closeMobileSidebar = () => setMobileOpen(false);

    return (
        <div className="app-shell">
            {/* HEAVY NETWORKING PARTICLES — fixed behind everything */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <ParticleCanvas
                    count={70}
                    networking={true}
                    color="#7c3aed"
                    accent="#00e5ff"
                    speed={0.35}
                    maxDist={130}
                    size={1.4}
                    opacity={0.6}
                />
            </div>

            {/* Ambient glow orbs on top of particles */}
            <AmbientOrbs />

            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMobileSidebar}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 49 }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (mobile-aware) */}
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(c => !c)}
                mobileOpen={mobileOpen}
                onMobileClose={closeMobileSidebar}
                onMobileOpen={() => setMobileOpen(true)}
            />

            <AnimatePresence mode="wait">
                <motion.main
                    key="main"
                    className={`main-content${collapsed ? ' collapsed' : ''}`}
                    style={{ paddingTop: 20 }} // Add some padding since TopBar is gone
                    layout
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                >
                    <motion.div
                        key="outlet"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Outlet />
                    </motion.div>
                </motion.main>
            </AnimatePresence>

            <GlobalAI />
        </div>
    );
}
