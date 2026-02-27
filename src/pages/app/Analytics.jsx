import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBarChart2, FiTarget, FiTrendingUp, FiZap, FiAward, FiStar,
    FiActivity, FiBriefcase, FiDollarSign, FiHeart, FiSun,
    FiRotateCcw, FiCheckCircle, FiCircle,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, SYSTEM_PROMPTS } from '../../lib/aiService';

const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ display: 'inline-flex', color: '#7c3aed' }}>
        <FiRotateCcw size={18} />
    </motion.div>
);

const TABS = [
    { id: 'overview', label: 'Growth Score', icon: <FiBarChart2 size={14} /> },
    { id: 'trends', label: 'Trends', icon: <FiTrendingUp size={14} /> },
    { id: 'gamified', label: 'Achievements', icon: <FiAward size={14} /> },
    { id: 'ai', label: 'AI Analyst', icon: <FiZap size={14} /> },
];

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d } });

function Card({ children, style = {} }) {
    return <div style={{ borderRadius: 18, background: 'var(--app-surface)', border: '1px solid var(--app-border)', padding: 22, ...style }}>{children}</div>;
}

function Score({ value, color = '#7c3aed', size = 80 }) {
    const r = size / 2 - 8;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / 100, 1);
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
                <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - circ * pct }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: size / 4.5, fontWeight: 900, color }}>
                {value}
            </div>
        </div>
    );
}

export default function Analytics() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const today = new Date().toISOString().split('T')[0];
            const [taskRes, habitRes, goalRes, txRes, workoutRes, journalRes, moodRes, gratRes, focusRes, resumeRes] = await Promise.all([
                supabase.from('tasks').select('status,priority,created_at').eq('user_id', user.id),
                supabase.from('habits').select('streak,completions,name').eq('user_id', user.id),
                supabase.from('savings_goals').select('name,target_amount,current_amount').eq('user_id', user.id),
                supabase.from('transactions').select('amount,type,category,date').eq('user_id', user.id),
                supabase.from('workouts').select('type,duration_minutes,completed_at').eq('user_id', user.id),
                supabase.from('journal_entries').select('id,created_at').eq('user_id', user.id),
                supabase.from('mood_logs').select('mood_value,logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30),
                supabase.from('gratitude_entries').select('id').eq('user_id', user.id),
                supabase.from('focus_sessions').select('duration_minutes').eq('user_id', user.id),
                supabase.from('resumes').select('id').eq('user_id', user.id),
            ]);

            const tasks = taskRes.data || [];
            const habits = habitRes.data || [];
            const goals = goalRes.data || [];
            const txs = txRes.data || [];
            const workouts = workoutRes.data || [];
            const journals = journalRes.data || [];
            const moods = moodRes.data || [];
            const gratitude = gratRes.data || [];
            const focus = focusRes.data || [];
            const resumes = resumeRes.data || [];

            // Scores (0-100 each)
            const doneRatio = tasks.length ? tasks.filter(t => t.status === 'done').length / tasks.length : 0;
            const focusMins = focus.reduce((s, f) => s + (f.duration_minutes || 0), 0);
            const productivityScore = Math.round(Math.min(100, doneRatio * 50 + habits.length * 5 + Math.min(focusMins / 60, 20) + Math.min(habits.reduce((s, h) => s + (h.streak || 0), 0) / 10, 20)));

            const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
            const savingsRate = income > 0 ? Math.max(0, (income - expense) / income) : 0;
            const financeScore = Math.round(Math.min(100, savingsRate * 60 + goals.length * 8 + (txs.length > 0 ? 20 : 0)));

            const fitnessScore = Math.round(Math.min(100, workouts.length * 6 + habits.filter(h => h.streak > 0).length * 5));

            const careerScore = Math.round(Math.min(100, resumes.length * 25 + (tasks.some(t => t.priority === 'high' && t.status === 'done') ? 30 : 0)));

            const avgMood = moods.length ? moods.reduce((s, m) => s + m.mood_value, 0) / moods.length : 0;
            const mentalScore = Math.round(Math.min(100, avgMood * 12 + journals.length * 3 + gratitude.length * 4));
            const overallScore = Math.round((productivityScore + financeScore + fitnessScore + mentalScore + careerScore) / 5);

            // Workout types breakdown
            const workoutTypes = {};
            workouts.forEach(w => { workoutTypes[w.type || 'Other'] = (workoutTypes[w.type || 'Other'] || 0) + 1; });

            // Monthly spend by category
            const catSpend = {};
            txs.filter(t => t.type === 'expense').forEach(t => { catSpend[t.category || 'Other'] = (catSpend[t.category || 'Other'] || 0) + Number(t.amount); });

            // Mood trend last 7
            const moodTrend = moods.slice(0, 7).reverse();

            setStats({
                overallScore, productivityScore, financeScore, fitnessScore, mentalScore, careerScore,
                tasks: { total: tasks.length, done: tasks.filter(t => t.status === 'done').length, open: tasks.filter(t => t.status !== 'done').length },
                habits: { total: habits.length, maxStreak: habits.length ? Math.max(...habits.map(h => h.streak || 0)) : 0, top: habits.sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 3) },
                finance: { income, expense, net: income - expense, catSpend, savingsRate: Math.round(savingsRate * 100), goalsCount: goals.length, goals },
                fitness: { count: workouts.length, totalMins: workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0), workoutTypes },
                mental: { journals: journals.length, avgMood: avgMood ? avgMood.toFixed(1) : null, moodTrend, gratitude: gratitude.length },
                focus: { totalMins: focusMins, sessionCount: focus.length },
                career: { resumes: resumes.length }
            });
            setLoading(false);

            // Try to load last AI report
            const { data: reportData } = await supabase
                .from('ai_history')
                .select('output')
                .eq('user_id', user.id)
                .eq('module', 'analytics')
                .eq('topic', 'life_report')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (reportData) {
                // We'll pass this via a callback or effect to AIAnalystTab
            }
        })();
    }, [user]);

    return (
        <div className="page-shell">
            <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
                <div className="page-tag"><FiBarChart2 size={10} /> Analytics</div>
                <h1 className="page-title">Life Analytics</h1>
                <p className="page-desc">Real insights across every domain of your life — powered by your actual data.</p>
            </motion.div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', border: tab === t.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent', background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#f0f0ff' : 'var(--text-3)', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14 }}>
                    <Spinner /><span style={{ color: 'var(--text-3)', fontSize: 14 }}>Analysing your data...</span>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {tab === 'overview' && <OverviewTab stats={stats} />}
                        {tab === 'trends' && <TrendsTab stats={stats} />}
                        {tab === 'gamified' && <AchievementsTab stats={stats} />}
                        {tab === 'ai' && <AIAnalystTab stats={stats} userId={user.id} />}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}

/* ── Overview Tab ─────────────────────────────────── */
function OverviewTab({ stats }) {
    const domains = [
        { label: 'Productivity', score: stats.productivityScore, color: '#7c3aed', icon: <FiZap /> },
        { label: 'Career', score: stats.careerScore, color: '#fbbf24', icon: <FiBriefcase /> },
        { label: 'Finance', score: stats.financeScore, color: '#10b981', icon: <FiDollarSign /> },
        { label: 'Fitness', score: stats.fitnessScore, color: '#ec4899', icon: <FiHeart /> },
        { label: 'Mental', score: stats.mentalScore, color: '#f59e0b', icon: <FiSun /> },
    ];

    if (stats.overallScore === 0 && stats.tasks.total === 0) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.7 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>No data yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Start using Productivity, Finance, Fitness and Mental modules to see your analytics.</div>
        </div>
    );

    return (
        <div>
            {/* Master score */}
            <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg,rgba(124,58,237,0.07),rgba(0,245,255,0.03))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                    <Score value={stats.overallScore} color="#7c3aed" size={110} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Overall Life Score</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{stats.overallScore}<span style={{ fontSize: 16, color: 'var(--text-3)' }}>/100</span></div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>
                            Based on {stats.tasks.total} tasks, {stats.habits.total} habits, {stats.fitness.count} workouts, and {stats.mental.journals} journal entries.
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }}>
                {domains.map((d, i) => (
                    <motion.div key={i} {...fadeUp(i * 0.06)}>
                        <Card style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 20px' }}>
                            <Score value={d.score} color={d.color} size={64} />
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: d.color, fontSize: 13 }}>{d.icon}<span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{d.label}</span></div>
                                <div style={{ height: 4, width: 100, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.score}%` }} transition={{ duration: 1.1, delay: 0.2 }} style={{ height: '100%', borderRadius: 2, background: d.color }} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
                {[
                    { label: 'Tasks Done', value: stats.tasks.done, icon: '✅', color: '#10b981' },
                    { label: 'Habit Streak', value: `${stats.habits.maxStreak}d`, icon: '🔥', color: '#f59e0b' },
                    { label: 'Workouts', value: stats.fitness.count, icon: '💪', color: '#ec4899' },
                    { label: 'Journal Entries', value: stats.mental.journals, icon: '📓', color: '#7c3aed' },
                    { label: 'Savings Rate', value: `${stats.finance.savingsRate}%`, icon: '💰', color: '#00f5ff' },
                    { label: 'Avg Mood', value: stats.mental.avgMood ? `${stats.mental.avgMood}/5` : '–', icon: '😊', color: '#f97316' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: `${s.color}0a`, border: `1px solid ${s.color}20` }}>
                        <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, fontWeight: 900, color: s.color }}>{s.value ?? 0}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Trends Tab ───────────────────────────────────── */
function TrendsTab({ stats }) {
    const { fitness, finance, mental, habits } = stats;
    const maxCat = Object.entries(finance.catSpend).sort((a, b) => b[1] - a[1]);
    const maxType = Object.entries(fitness.workoutTypes).sort((a, b) => b[1] - a[1]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Mood trend */}
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>😊 Mood Trend (Last 7 Logs)</div>
                {mental.moodTrend.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13, color: 'var(--text-2)' }}>No mood logs yet</div>
                ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                        {mental.moodTrend.map((m, i) => {
                            const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#00f5ff'];
                            const c = colors[m.mood_value - 1] || '#7c3aed';
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <motion.div initial={{ height: 0 }} animate={{ height: `${m.mood_value / 5 * 70}px` }} transition={{ duration: 0.6, delay: i * 0.07 }}
                                        style={{ width: '100%', background: `${c}40`, border: `1px solid ${c}`, borderRadius: 4, minHeight: 6 }} />
                                    <span style={{ fontSize: 12 }}>{'😔😕😐🙂😄'[m.mood_value - 1]}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Top habits by streak */}
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>🔥 Top Habit Streaks</div>
                {habits.top.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13, color: 'var(--text-2)' }}>No habits tracked yet</div>
                ) : habits.top.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 900, color: '#f59e0b', width: 36 }}>{h.streak || 0}d</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{h.name}</div>
                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((h.streak || 0) / 30 * 100, 100)}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', borderRadius: 2, background: '#f59e0b' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </Card>

            {/* Spending breakdown */}
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>💸 Spending by Category</div>
                {maxCat.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13, color: 'var(--text-2)' }}>No expenses recorded</div>
                ) : maxCat.slice(0, 5).map(([cat, amt], i) => {
                    const max = maxCat[0][1];
                    const COLORS = ['#7c3aed', '#00f5ff', '#f59e0b', '#ec4899', '#10b981'];
                    return (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{cat}</span>
                                <span style={{ fontSize: 13, color: COLORS[i % 5], fontWeight: 700 }}>${Number(amt).toFixed(0)}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(amt / max) * 100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', borderRadius: 3, background: COLORS[i % 5] }} />
                            </div>
                        </div>
                    );
                })}
            </Card>

            {/* Workout types */}
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>🏋️ Workout Types</div>
                {maxType.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, opacity: 0.5, fontSize: 13, color: 'var(--text-2)' }}>No workouts logged yet</div>
                ) : maxType.slice(0, 5).map(([type, count], i) => {
                    const max = maxType[0][1];
                    const COLORS = ['#ec4899', '#7c3aed', '#00f5ff', '#f59e0b', '#10b981'];
                    return (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{type}</span>
                                <span style={{ fontSize: 13, color: COLORS[i % 5], fontWeight: 700 }}>{count} sessions</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', borderRadius: 3, background: COLORS[i % 5] }} />
                            </div>
                        </div>
                    );
                })}
                {fitness.totalMins > 0 && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', fontSize: 12, color: '#ec4899', fontWeight: 700 }}>
                        🏆 {fitness.totalMins} total minutes trained
                    </div>
                )}
            </Card>
        </div>
    );
}

/* ── Achievements Tab ─────────────────────────────── */
function AchievementsTab({ stats }) {
    const achievements = [
        { id: 'first_task', title: 'First Step', desc: 'Complete your first task', icon: '✅', unlocked: stats.tasks.done >= 1 },
        { id: 'task10', title: 'Task Crusher', desc: 'Complete 10 tasks', icon: '🎯', unlocked: stats.tasks.done >= 10 },
        { id: 'habit', title: 'Habit Builder', desc: 'Create your first habit', icon: '🔁', unlocked: stats.habits.total >= 1 },
        { id: 'streak7', title: 'Week Warrior', desc: 'Reach a 7-day streak', icon: '🔥', unlocked: stats.habits.maxStreak >= 7 },
        { id: 'streak30', title: 'Iron Discipline', desc: 'Reach a 30-day streak', icon: '⚔️', unlocked: stats.habits.maxStreak >= 30 },
        { id: 'workout1', title: 'First Sweat', desc: 'Log your first workout', icon: '💪', unlocked: stats.fitness.count >= 1 },
        { id: 'workout10', title: 'Fitness Fanatic', desc: 'Log 10 workouts', icon: '🏋️', unlocked: stats.fitness.count >= 10 },
        { id: 'journal1', title: 'Reflective', desc: 'Write your first journal entry', icon: '📓', unlocked: stats.mental.journals >= 1 },
        { id: 'journal10', title: 'Mindful Writer', desc: 'Write 10 journal entries', icon: '✍️', unlocked: stats.mental.journals >= 10 },
        { id: 'save', title: 'Saver', desc: 'Have a positive savings rate', icon: '💰', unlocked: stats.finance.savingsRate > 0 },
        { id: 'goals', title: 'Goal Setter', desc: 'Create your first savings goal', icon: '🎪', unlocked: stats.finance.goalsCount >= 1 },
        { id: 'score50', title: 'Halfway There', desc: 'Reach overall score of 50', icon: '⭐', unlocked: stats.overallScore >= 50 },
        { id: 'score75', title: 'High Performer', desc: 'Reach overall score of 75', icon: '🌟', unlocked: stats.overallScore >= 75 },
        { id: 'alldomains', title: 'Renaissance', desc: 'Have data in all 4 domains', icon: '🏆', unlocked: stats.tasks.total > 0 && stats.finance.income + stats.finance.expense > 0 && stats.fitness.count > 0 && stats.mental.journals > 0 },
    ];

    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);

    return (
        <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, padding: '18px 22px', borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900, color: '#7c3aed' }}>{unlocked.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Achievements Unlocked</div>
                </div>
                <div style={{ flex: 1, padding: '18px 22px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900, color: '#f59e0b' }}>{locked.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Still to Unlock</div>
                </div>
                <div style={{ flex: 1, padding: '18px 22px', borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900, color: '#10b981' }}>{Math.round(unlocked.length / achievements.length * 100)}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Completion Rate</div>
                </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🏆 Unlocked</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
                {unlocked.map(a => (
                    <motion.div key={a.id} whileHover={{ scale: 1.03 }} style={{ padding: '16px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.desc}</div>
                    </motion.div>
                ))}
                {unlocked.length === 0 && <div style={{ padding: 20, opacity: 0.5, fontSize: 13, color: 'var(--text-2)' }}>Start using PriMaX to earn achievements.</div>}
            </div>

            {locked.length > 0 && (
                <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🔒 Locked</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                        {locked.map(a => (
                            <div key={a.id} style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}>
                                <div style={{ fontSize: 28, marginBottom: 8, filter: 'grayscale(1)' }}>{a.icon}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 3 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.desc}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ── AI Analyst Tab ───────────────────────────────── */
function AIAnalystTab({ stats, userId }) {
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');

    useEffect(() => {
        if (!userId) return;
        const loadReport = async () => {
            const { data } = await supabase
                .from('ai_history')
                .select('output')
                .eq('user_id', userId)
                .eq('module', 'analytics')
                .eq('topic', 'life_report')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) setReport(data.output);
        };
        loadReport();
    }, [userId]);

    const generateReport = async () => {
        setLoading(true);
        const ctx = `User's life analytics:
- Overall Score: ${stats.overallScore}/100
- Productivity: ${stats.productivityScore}/100 | Focus: ${stats.focus.totalMins} mins | Tasks done: ${stats.tasks.done}/${stats.tasks.total}
- Career: ${stats.careerScore}/100 | Resumes: ${stats.career.resumes}
- Finance: ${stats.financeScore}/100 | Net: $${(stats.finance.net || 0).toFixed(0)} | Savings rate: ${stats.finance.savingsRate}%
- Fitness: ${stats.fitnessScore}/100 | Workouts: ${stats.fitness.count} | Total minutes: ${stats.fitness.totalMins}
- Mental: ${stats.mentalScore}/100 | Avg mood: ${stats.mental.avgMood || 'N/A'}/5 | Journal entries: ${stats.mental.journals}

${q ? `User question: "${q}"` : 'Give a comprehensive life performance analysis. Identify strengths, weakest areas, and 3 top priority actions to improve the overall score. Be specific and motivating.'}`;

        const { text, error } = await callGemini(ctx, SYSTEM_PROMPTS.global);

        if (!error && text) {
            setReport(text);
            // Persist to Supabase
            await supabase.from('ai_history').insert({
                user_id: userId,
                module: 'analytics',
                topic: 'life_report',
                input: q || 'General life report',
                output: text
            });
        } else {
            setReport(`⚠️ ${error || 'Failed to generate report'}`);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🧬</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>AI Life Analyst</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 18 }}>Your AI analyst has access to all your real data. Ask anything about your performance.</p>
                <textarea value={q} onChange={e => setQ(e.target.value)} placeholder="Optional: Ask a specific question about your analytics..." rows={3}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', borderRadius: 12, padding: 12, color: 'var(--text-1)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, marginBottom: 14 }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateReport} disabled={loading}
                    style={{ padding: 12, width: '100%', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}>
                    {loading ? <><Spinner /> Analysing...</> : <><FiZap /> Generate AI Report</>}
                </motion.button>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {['What is my biggest weakness right now?', 'How can I improve my productivity score?', 'Give me a 30-day improvement plan', 'Where should I focus my energy this month?'].map((p, i) => (
                        <button key={i} onClick={() => setQ(p)} style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>💡 {p}</button>
                    ))}
                </div>
            </Card>
            <Card>
                {report ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📊 AI Analysis</div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.9, whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 500 }}>{report}</div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.5, padding: 32 }}>
                        <span style={{ fontSize: 44, marginBottom: 14 }}>📈</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Your AI analysis will appear here</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>Click "Generate AI Report" to get started</div>
                    </div>
                )}
            </Card>
        </div>
    );
}
