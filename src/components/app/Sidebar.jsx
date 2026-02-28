import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiZap, FiBriefcase, FiDollarSign,
    FiHeart, FiSun, FiBarChart2, FiMessageCircle,
    FiSettings, FiChevronLeft, FiChevronRight,
    FiBell, FiLogOut, FiUser, FiSearch, FiCommand
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ParticleCanvas from '../ParticleCanvas';
import '../../App.css';

const navSections = [
    {
        label: 'Overview',
        items: [
            { to: '/app/dashboard', icon: <FiGrid />, label: 'Command Center', exact: true },
        ],
    },
    {
        label: 'Growth Modules',
        items: [
            { to: '/app/productivity', icon: <FiZap />, label: 'Productivity', color: '#00e5ff' },
            { to: '/app/career', icon: <FiBriefcase />, label: 'Career', color: '#fbbf24' },
            { to: '/app/finance', icon: <FiDollarSign />, label: 'Finance', color: '#10b981' },
            { to: '/app/fitness', icon: <FiHeart />, label: 'Fitness', color: '#e879f9' },
            { to: '/app/mental', icon: <FiSun />, label: 'Mental Growth', color: '#f97316' },
        ],
    },
    {
        label: 'Intelligence',
        items: [
            { to: '/app/analytics', icon: <FiBarChart2 />, label: 'Analytics', color: '#7c3aed' },
            { to: '/app/ai', icon: <FiMessageCircle />, label: 'AI Assistant', color: '#00e5ff' },
        ],
    },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onMobileOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifs = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (data) setNotifs(data);
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchNotifs();
        const channel = supabase.channel('sidebar-notifs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifs)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, fetchNotifs]);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const unreadCount = notifs.filter(n => !n.is_read).length;
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
            {/* Subtle mini particles for depth */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}>
                <ParticleCanvas count={15} speed={0.2} size={1} color="#7c3aed" networking={false} />
            </div>

            {/* Header */}
            <div className="sidebar-header">
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #00e5ff 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                    position: 'relative', overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', position: 'relative', zIndex: 1 }}>PX</span>
                </div>
                <AnimatePresence>
                    <motion.span
                        className="sidebar-brand"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.22 }}
                    >
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1 }}>
                            <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #f0f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PriMaX</span>
                            <span style={{ color: '#00e5ff' }}> Hub</span>
                        </span>
                    </motion.span>
                </AnimatePresence>

                {/* Notifications at Top */}
                <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }} ref={notifRef}>
                    <motion.button
                        whileHover={{ scale: 1.1, background: 'rgba(124,58,237,0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowNotifs(!showNotifs)}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--app-border)',
                            color: showNotifs ? '#7c3aed' : 'var(--text-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiBell size={14} />
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#7c3aed', borderRadius: '50%', border: '1.5px solid var(--sidebar-bg)', boxShadow: '0 0 10px rgba(124,58,237,0.4)' }} />
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showNotifs && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10, x: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10, x: -10 }}
                                style={{
                                    position: 'absolute', top: 'calc(100% + 12px)', left: 0,
                                    width: 300, background: 'var(--app-surface-solid)',
                                    border: '1px solid var(--app-border)', borderRadius: 16,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(124,58,237,0.1)', zIndex: 2000,
                                    padding: '18px', backdropFilter: 'blur(32px)',
                                    borderTop: '1px solid rgba(124,58,237,0.3)'
                                }}
                            >
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '0.08em' }}>
                                    NOTIFICATIONS
                                    {unreadCount > 0 && <span style={{ fontSize: 10, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 100 }}>{unreadCount} NEW</span>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                                    {notifs.length === 0 ? (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                                            <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                                            No new notifications
                                        </div>
                                    ) : notifs.map(n => (
                                        <div key={n.id} style={{ padding: '10px 12px', borderRadius: 10, background: n.is_read ? 'transparent' : 'rgba(124,58,237,0.04)', border: '1px solid var(--app-border)' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{n.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {navSections.map((section) => (
                    <div key={section.label} style={{ marginBottom: 4 }}>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div
                                    className="sidebar-section-label"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {section.label}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {section.items.map((item) => {
                            const isActive = item.exact
                                ? location.pathname === item.to || location.pathname === '/app' || location.pathname === '/app/'
                                : location.pathname.startsWith(item.to);
                            const color = item.color || '#7c3aed';

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.exact}
                                    className={({ isActive: ia }) => `nav-item${ia ? ' active' : ''}`}
                                    title={collapsed ? item.label : ''}
                                    style={({ isActive: ia }) => ia ? { color } : {}}
                                >
                                    {({ isActive: ia }) => (
                                        <>
                                            {/* Active background glow */}
                                            {ia && (
                                                <motion.div
                                                    layoutId="activeNavBg"
                                                    style={{
                                                        position: 'absolute', inset: 0, borderRadius: 12,
                                                        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                                                        border: `1px solid ${color}28`,
                                                    }}
                                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                />
                                            )}
                                            <span className="nav-icon" style={{ color: ia ? color : undefined, position: 'relative', zIndex: 1 }}>
                                                {item.icon}
                                            </span>
                                            <AnimatePresence>
                                                {!collapsed && (
                                                    <motion.span
                                                        className="nav-label"
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.22 }}
                                                        style={{ position: 'relative', zIndex: 1 }}
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* User Profile & Notifications */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px' }}>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', transition: 'all 0.2s' }}
                            onClick={() => navigate('/app/settings')}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                        >
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'white', border: '2px solid rgba(255,255,255,0.1)' }}>
                                {initials}
                            </div>
                            {!collapsed && (
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {userName} <span style={{ fontSize: 8, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>PRO</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#fbbf24', whiteSpace: 'nowrap', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        PriMaX Pro Plan
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.button
                        className="collapse-btn"
                        onClick={onToggle}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        whileHover={{ x: collapsed ? 2 : -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="nav-icon">
                            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                        </span>
                        {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Collapse</span>}
                    </motion.button>
                </div>
            </div>
        </aside>
    );
}
