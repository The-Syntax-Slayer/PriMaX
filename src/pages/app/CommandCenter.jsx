import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiZap, FiTarget, FiTrendingUp, FiClock, FiStar,
    FiCheckCircle, FiCircle, FiArrowRight, FiArrowUp,
    FiActivity, FiSun, FiMoon, FiCalendar, FiChevronRight,
    FiDollarSign, FiHeart, FiBriefcase, FiBarChart2,
    FiMessageCircle, FiAlertCircle, FiAward, FiPlus,
    FiShield, FiLayers, FiCompass, FiCpu, FiBookOpen, FiFileText, FiUsers
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { injectMockData, clearMockData } from '../../lib/mockData';

import { FiRefreshCw, FiDatabase } from 'react-icons/fi';

const weeklyScores = [72, 78, 65, 88, 82, 91, 88];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const lifeDimensions = [
    { label: 'Mind', pct: 92, color: '#7c3aed', icon: '🧠' },
    { label: 'Body', pct: 78, color: '#10b981', icon: '💪' },
    { label: 'Career', pct: 85, color: '#00e5ff', icon: '💼' },
    { label: 'Wealth', pct: 71, color: '#fbbf24', icon: '💰' },
    { label: 'Social', pct: 80, color: '#e879f9', icon: '👥' },
    { label: 'Spirit', pct: 88, color: '#f97316', icon: '✨' },
];
const aiInsights = [
    { emoji: '🎯', title: 'Start with your highest priority task', body: 'Research shows starting the day tackling your most important task leads to 38% better productivity. Identify and tackle your #1 item first thing.', color: '#7c3aed', action: 'View Tasks', actionTo: '/app/productivity' },
    { emoji: '💸', title: 'Review your financial health', body: 'Regular spending reviews unlock hidden savings opportunities. Check your income vs expenses dashboard to see where your money is really going this month.', color: '#fbbf24', action: 'Review Finance', actionTo: '/app/finance' },
    { emoji: '🔥', title: "Don't break your streak", body: "Consistency is the secret to mastery. Log today's habits and workout to maintain your momentum. Even 10 minutes counts!", color: '#e879f9', action: 'Log Habits', actionTo: '/app/fitness' },
    { emoji: '🧠', title: "Reflect on today's wins", body: "Studies show that journaling your wins increases satisfaction by 27% and primes your brain for better performance tomorrow.", color: '#00e5ff', action: 'Open Journal', actionTo: '/app/mental' },
    { emoji: '🚀', title: 'Polish your career roadmap', body: "Professionals who update their skill profile monthly get 3x more opportunities. Check your Career hub and add any new skills earned this week.", color: '#10b981', action: 'View Career', actionTo: '/app/career' },
    { emoji: '⏱', title: 'Schedule a deep work block', body: "Distractions cut deep work sessions by 40%. Try a focused 25-minute Pomodoro sprint now - even one session can move the needle on your most important project.", color: '#f97316', action: 'Start Focus', actionTo: '/app/productivity' },
];

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

function Card({ children, style = {}, glow, ...rest }) {
    return (
        <div style={{
            borderRadius: 22, background: 'var(--app-surface)', border: '1px solid var(--app-border)',
            backdropFilter: 'blur(14px)', padding: 24, position: 'relative', overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            ...(glow ? { boxShadow: `0 0 40px ${glow}20` } : {}),
            ...style,
        }} {...rest}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none' }} />
            {children}
        </div>
    );
}

function SectionTitle({ children, icon, action }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <span style={{ color: '#7c3aed' }}>{icon}</span>{children}
            </h3>
            {action && (
                <Link to={action.to} style={{ fontSize: 12, color: '#00e5ff', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8, transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.opacity = 1}
                    onMouseOut={e => e.currentTarget.style.opacity = 0.8}
                >
                    {action.label} <FiChevronRight size={12} />
                </Link>
            )}
        </div>
    );
}

function GrowthRing({ score = 847 }) {
    const max = 1000;
    const pct = score / max;
    const r = 56;
    const circ = 2 * Math.PI * r;
    return (
        <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#00e5ff" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <motion.circle
                    cx="75" cy="75" r={r} fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - circ * pct }}
                    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    filter="url(#glow)"
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}
                >
                    {score}
                </motion.span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontWeight: 700, letterSpacing: '0.08em' }}>/ 1000</span>
            </div>
        </div>
    );
}

function WeeklyChart() {
    const todayIdx = 6;
    const maxVal = Math.max(...weeklyScores);
    return (
        <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 90 }}>
                {weeklyScores.map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.07 }}
                            style={{ fontSize: 10, color: i === todayIdx ? '#00e5ff' : 'var(--text-3)', fontWeight: 700 }}
                        >
                            {h}
                        </motion.span>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 60, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(h / maxVal) * 60}px` }}
                                transition={{ duration: 0.8, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    width: '100%', borderRadius: 8, alignSelf: 'flex-end',
                                    background: i === todayIdx
                                        ? 'linear-gradient(to top, #7c3aed, #00e5ff)'
                                        : `rgba(124,58,237,${0.15 + (i / todayIdx) * 0.2})`,
                                    boxShadow: i === todayIdx ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
                                }}
                            />
                        </div>
                        <span style={{ fontSize: 10, color: i === todayIdx ? '#00e5ff' : 'var(--text-3)', fontWeight: i === todayIdx ? 700 : 400 }}>
                            {weekDays[i]}
                        </span>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Weekly average</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)} pts
                    <span style={{ color: '#10b981' }}>↑ +8 vs last week</span>
                </span>
            </div>
        </div>
    );
}

export default function CommandCenter() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [insightIdx, setInsightIdx] = useState(0);
    const [dismissedCount, setDismissedCount] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [moduleStats, setModuleStats] = useState({});
    const [loaded, setLoaded] = useState(false);
    const [growthScore, setGrowthScore] = useState(847);
    const [isPresentationMode, setIsPresentationMode] = useState(() => localStorage.getItem('primax_demo_mode') === 'true');
    const [modeLoading, setModeLoading] = useState(false);

    const overviewStats = [
        { label: 'Open Tasks', value: moduleStats.openTasks ?? '–', delta: 'Productivity', color: '#7c3aed', icon: <FiTarget />, bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.22)' },
        { label: 'Habit Streak', value: moduleStats.streak != null ? `${moduleStats.streak}d` : '–', delta: 'days in a row', color: '#fbbf24', icon: <FiZap />, bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
        { label: 'Savings Goals', value: moduleStats.goals ?? '–', delta: 'active goals', color: '#00e5ff', icon: <FiActivity />, bg: 'rgba(0,229,255,0.07)', border: 'rgba(0,229,255,0.18)' },
        { label: 'Net Balance', value: moduleStats.net ?? '–', delta: 'income – expenses', color: '#10b981', icon: <FiStar />, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    ];

    const moduleActivity = [
        { icon: <FiZap />, label: 'Productivity', value: `${moduleStats.openTasks ?? 0} tasks`, change: 'Tap to manage', color: '#7c3aed', path: '/app/productivity' },
        { icon: <FiBriefcase />, label: 'Career', value: moduleStats.careerRole ?? 'Set up profile', change: 'View roadmap', color: '#00e5ff', path: '/app/career' },
        { icon: <FiDollarSign />, label: 'Finance', value: moduleStats.net ?? 'No data', change: 'Track spending', color: '#fbbf24', path: '/app/finance' },
        { icon: <FiHeart />, label: 'Fitness', value: `${moduleStats.workouts ?? 0} workouts`, change: `${moduleStats.streak ?? 0}d streak`, color: '#e879f9', path: '/app/fitness' },
        { icon: <FiSun />, label: 'Mental', value: `${moduleStats.journals ?? 0} entries`, change: 'Journal & Mood', color: '#f97316', path: '/app/mental' },
        { icon: <FiBarChart2 />, label: 'Analytics', value: 'View insights', change: 'Cross-domain', color: '#10b981', path: '/app/analytics' },
    ];

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setInsightIdx(i => (i + 1) % aiInsights.length), 7000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const today = new Date().toISOString().split('T')[0];
            const thisMonth = today.substring(0, 7);
            const [taskRes, habitRes, goalRes, txRes, workoutRes, journalRes, careerRes] = await Promise.all([
                supabase.from('tasks').select('status').eq('user_id', user.id).neq('status', 'done').limit(5),
                supabase.from('habits').select('streak,completions').eq('user_id', user.id),
                supabase.from('savings_goals').select('id').eq('user_id', user.id),
                supabase.from('transactions').select('amount,type').eq('user_id', user.id),
                supabase.from('workouts').select('id').eq('user_id', user.id).gte('completed_at', thisMonth + '-01'),
                supabase.from('journal_entries').select('id').eq('user_id', user.id),
                supabase.from('career_profiles').select('target_role').eq('user_id', user.id).maybeSingle(),
            ]);
            const habits = habitRes.data || [];
            const maxStreak = habits.length ? Math.max(...habits.map(h => h.streak || 0)) : 0;
            const txs = txRes.data || [];
            const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
            const net = income - expense;
            const { data: latestTasks } = await supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'done').order('created_at', { ascending: false }).limit(6);
            setTasks((latestTasks || []).map(t => ({ id: t.id, text: t.title, module: 'Productivity', color: '#7c3aed', urgent: t.priority === 'high', done: false })));
            const openT = (taskRes.data || []).length;
            const ws = (workoutRes.data || []).length;
            const js = (journalRes.data || []).length;
            const gs = (goalRes.data || []).length;
            // Compute a rough Growth Score from real data
            const computed = Math.min(1000, Math.round(
                (maxStreak * 18) + (ws * 25) + (js * 15) + (gs * 30) +
                (net > 0 ? 120 : 40) + (openT > 0 ? 200 : 80)
            ));
            setGrowthScore(computed > 100 ? computed : 847);
            setModuleStats({
                openTasks: openT,
                streak: maxStreak,
                goals: gs,
                net: net !== 0 ? `${net >= 0 ? '+' : ''}₹${Math.abs(net).toFixed(0)}` : '₹0',
                workouts: ws,
                journals: js,
                careerRole: careerRes.data?.target_role || null,
            });
            setLoaded(true);
        })();
    }, [user]);

    const hour = currentTime.getHours();
    const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetEmoji = hour < 5 ? '🌙' : hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙';
    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Growth Pioneer';
    const doneCount = tasks.filter(t => t.done).length;
    const dayPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const toggleTask = (i) => setTasks(ts => ts.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));
    const dismissInsight = () => {
        setDismissedCount(c => c + 1);
        setInsightIdx(i => (i + 1) % aiInsights.length);
    };

    return (
        <div className="page-shell">
            {/* ── HERO HEADER ── */}
            <motion.div {...fadeUp(0)} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <motion.span
                                animate={{ rotate: [0, 10, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                                style={{ fontSize: 22 }}
                            >
                                {greetEmoji}
                            </motion.span>
                            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{formattedDate} · {formattedTime}</span>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    setModeLoading(true);
                                    if (isPresentationMode) {
                                        // Switch to Normal Mode
                                        const res = await clearMockData(user.id);
                                        if (res.success) {
                                            localStorage.removeItem('primax_demo_mode');
                                            setIsPresentationMode(false);
                                            window.location.reload();
                                        } else {
                                            alert('Error clearing demo data: ' + res.error);
                                        }
                                    } else {
                                        // Switch to Presentation Mode
                                        if (window.confirm('Activate Presentation Mode? This injects demo data into your account for showcasing.')) {
                                            const res = await injectMockData(user.id);
                                            if (res.success) {
                                                localStorage.setItem('primax_demo_mode', 'true');
                                                setIsPresentationMode(true);
                                                window.location.reload();
                                            } else {
                                                alert('Error injecting data: ' + res.error);
                                            }
                                        }
                                    }
                                    setModeLoading(false);
                                }}
                                style={{
                                    marginLeft: 16,
                                    background: isPresentationMode ? 'rgba(251,191,36,0.15)' : 'rgba(0,229,255,0.1)',
                                    border: `1px solid ${isPresentationMode ? 'rgba(251,191,36,0.4)' : 'rgba(0,229,255,0.3)'}`,
                                    borderRadius: 100, padding: '4px 12px', fontSize: 10,
                                    color: isPresentationMode ? '#fbbf24' : '#00e5ff',
                                    fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: isPresentationMode ? '0 0 12px rgba(251,191,36,0.2)' : 'none',
                                    transition: 'all 0.3s ease',
                                    opacity: modeLoading ? 0.6 : 1,
                                }}
                            >
                                {modeLoading ? (
                                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                                        <FiRefreshCw size={10} />
                                    </motion.span>
                                ) : (
                                    <FiDatabase size={10} />
                                )}
                                {modeLoading ? 'Switching...' : isPresentationMode ? '⚡ Normal Mode' : 'Presentation Mode'}
                            </motion.button>
                        </div>
                        <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                            {greeting},{' '}
                            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {userName}
                            </span>{' '}
                            👋
                        </h1>
                        <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.7 }}>
                            {tasks.length > 0
                                ? <><strong style={{ color: '#10b981' }}>{doneCount} of {tasks.length}</strong> priority tasks done. {dayPct >= 50 ? "You're crushing it! 🚀" : "Let's make today count."}</>
                                : 'Add tasks in Productivity to track your daily progress.'}
                        </p>
                    </div>

                    {/* Day progress pill */}
                    <motion.div
                        {...fadeUp(0.12)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderRadius: 20, background: 'var(--app-surface)', border: '1px solid var(--app-border)', backdropFilter: 'blur(14px)', cursor: 'default' }}
                    >
                        <div style={{ position: 'relative', width: 56, height: 56 }}>
                            <svg width="56" height="56" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                                <defs>
                                    <linearGradient id="dayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#00e5ff" />
                                    </linearGradient>
                                </defs>
                                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                                <motion.circle cx="28" cy="28" r="24" fill="none" stroke="url(#dayGrad)" strokeWidth="5"
                                    strokeLinecap="round" strokeDasharray={151}
                                    initial={{ strokeDashoffset: 151 }}
                                    animate={{ strokeDashoffset: 151 - (151 * dayPct / 100) }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#10b981' }}>{dayPct}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Day Progress</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{doneCount}/{tasks.length || 0} tasks done</div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* ── STATS ROW ── */}
            <motion.div
                initial="initial"
                animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}
            >
                {overviewStats.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                        whileHover={{ scale: 1.03, y: -3 }}
                        style={{ padding: '22px 24px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, transition: 'all 0.22s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: `${s.color}18`, filter: 'blur(20px)', pointerEvents: 'none' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 16 }}>
                                {s.icon}
                            </div>
                            <span style={{ fontSize: 10, color: s.color, fontWeight: 800, background: `${s.color}14`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.04em' }}>
                                {s.delta}
                            </span>
                        </div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                            {loaded ? s.value : <div className="skeleton" style={{ width: 60, height: 30 }} />}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── MAIN GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, alignItems: 'start' }}>

                {/* LEFT (8 cols) */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* AI Insight Panel */}
                    <motion.div {...fadeUp(0.15)}>
                        <Card style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,229,255,0.05))`, border: '1px solid rgba(124,58,237,0.22)', overflow: 'hidden' }} glow={aiInsights[insightIdx].color}>
                            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: `${aiInsights[insightIdx].color}14`, filter: 'blur(50px)', transition: 'background 0.8s', pointerEvents: 'none' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <motion.div
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}
                                    >
                                        🤖
                                    </motion.div>
                                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00e5ff' }}>AI Coach Insight</span>
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {aiInsights.map((_, i) => (
                                        <motion.button key={i} onClick={() => setInsightIdx(i)}
                                            animate={{ width: i === insightIdx ? 18 : 6 }}
                                            style={{ height: 6, borderRadius: 3, background: i === insightIdx ? '#7c3aed' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', padding: 0 }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div key={insightIdx}
                                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.38 }}
                                >
                                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                                        <motion.span
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ fontSize: 36, flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.5))' }}
                                        >
                                            {aiInsights[insightIdx].emoji}
                                        </motion.span>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 7 }}>{aiInsights[insightIdx].title}</h4>
                                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75, marginBottom: 16 }}>{aiInsights[insightIdx].body}</p>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                <Link to={aiInsights[insightIdx].actionTo}>
                                                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                        style={{ padding: '9px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #00e5ff)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                                                        {aiInsights[insightIdx].action} <FiArrowRight size={12} />
                                                    </motion.button>
                                                </Link>
                                                <motion.button
                                                    whileHover={{ scale: 1.04, borderColor: 'rgba(239,68,68,0.4)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={dismissInsight}
                                                    style={{ padding: '9px 16px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}
                                                >
                                                    Next insight →
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </motion.div>

                    {/* Priority Tasks */}
                    <motion.div {...fadeUp(0.2)}>
                        <Card>
                            <SectionTitle icon={<FiTarget size={13} />} action={{ label: 'View all', to: '/app/productivity' }}>
                                Priority Tasks
                            </SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {tasks.length === 0 ? (
                                    <Link to="/app/productivity" style={{ textAlign: 'center', padding: '28px', display: 'block', borderRadius: 16, border: '1px dashed rgba(124,58,237,0.2)', color: 'var(--text-3)', fontSize: 13, textDecoration: 'none', transition: 'all 0.2s' }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                                    >
                                        No open tasks — go add some in Productivity ✅
                                    </Link>
                                ) : tasks.map((task, i) => (
                                    <motion.div key={task.id ?? i}
                                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + i * 0.05 }}
                                        whileHover={{ x: 4 }}
                                        onClick={() => toggleTask(i)}
                                        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 16px', borderRadius: 14, background: task.done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${task.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.22s' }}
                                    >
                                        <motion.div whileTap={{ scale: 0.8 }} style={{ color: task.done ? '#10b981' : 'var(--text-3)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                            {task.done ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
                                        </motion.div>
                                        <span style={{ flex: 1, fontSize: 14, color: task.done ? 'var(--text-3)' : 'var(--text-1)', fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none', transition: 'all 0.22s' }}>
                                            {task.text}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            {task.urgent && !task.done && (
                                                <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171', fontWeight: 800 }}>HIGH</span>
                                            )}
                                            <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 100, background: `${task.color}14`, border: `1px solid ${task.color}28`, color: task.color, fontWeight: 600 }}>
                                                {task.module}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Module Snapshot */}
                    <motion.div {...fadeUp(0.26)}>
                        <Card>
                            <SectionTitle icon={<FiActivity size={13} />} action={{ label: 'Analytics', to: '/app/analytics' }}>
                                Module Snapshot
                            </SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {moduleActivity.map((m, i) => (
                                    <Link key={i} to={m.path} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                            whileHover={{ scale: 1.04, y: -3 }}
                                            whileTap={{ scale: 0.97 }}
                                            style={{ padding: '16px', borderRadius: 16, background: `${m.color}07`, border: `1px solid ${m.color}1a`, cursor: 'pointer', transition: 'all 0.22s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, fontSize: 14 }}>{m.icon}</div>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</span>
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: m.color, marginBottom: 3 }}>{m.value}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.change}</div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* RIGHT (4 cols) */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Growth Score */}
                    <motion.div {...fadeUp(0.1)}>
                        <Card>
                            <SectionTitle icon={<FiAward size={13} />} action={{ label: 'Full analytics', to: '/app/analytics' }}>
                                Growth Score
                            </SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                                <GrowthRing score={growthScore} />
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {lifeDimensions.map((d, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 13 }}>{d.icon}</span> {d.label}
                                                </span>
                                                <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{d.pct}%</span>
                                            </div>
                                            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${d.pct}%` }}
                                                    transition={{ duration: 1.3, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${d.color}, ${d.color}aa)`, position: 'relative' }}
                                                >
                                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer-slide 2s infinite' }} />
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    style={{ width: '100%', padding: '11px 16px', borderRadius: 14, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}
                                >
                                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>vs last week</span>
                                    <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <FiArrowUp size={13} /> +24 pts
                                    </span>
                                </motion.div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Weekly Performance */}
                    <motion.div {...fadeUp(0.18)}>
                        <Card>
                            <SectionTitle icon={<FiBarChart2 size={13} />} action={{ label: 'View trends', to: '/app/analytics' }}>
                                Weekly Performance
                            </SectionTitle>
                            <WeeklyChart />
                        </Card>
                    </motion.div>

                    {/* Today's Agenda */}
                    <motion.div {...fadeUp(0.24)}>
                        <Card>
                            <SectionTitle icon={<FiCalendar size={13} />}>Today's Agenda</SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 27, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,0.05)' }} />
                                {tasks.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0', opacity: 0.5 }}>
                                        <span style={{ fontSize: 32 }}>📅</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>Add tasks to build your agenda</span>
                                    </div>
                                ) : tasks.slice(0, 6).map((item, i) => (
                                    <motion.div key={item.id ?? i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 8px', borderRadius: 10, marginBottom: 2 }}
                                    >
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.done ? '#10b981' : 'rgba(255,255,255,0.12)', border: `2px solid ${item.done ? '#10b981' : 'rgba(255,255,255,0.1)'}`, flexShrink: 0, zIndex: 1, boxShadow: item.done ? '0 0 8px rgba(16,185,129,0.5)' : 'none' }} />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: 12, color: item.done ? 'var(--text-3)' : 'var(--text-2)', textDecoration: item.done ? 'line-through' : 'none' }}>
                                                {item.text}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: 10, color: item.color, background: `${item.color}14`, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>{item.module}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .cc-grid > div:first-child { grid-column: span 12 !important; }
                    .cc-grid > div:last-child  { grid-column: span 12 !important; }
                }
            `}</style>
        </div>
    );
}
