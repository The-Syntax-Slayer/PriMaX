import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiPlus, FiTrash2, FiZap, FiRotateCcw, FiX, FiCheck } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, SYSTEM_PROMPTS } from '../../lib/aiService';
import { HabitTracker } from './Productivity';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { useCallback } from 'react';

const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} style={{ display: 'inline-flex', color: '#7c3aed' }}>
        <FiRotateCcw size={13} />
    </motion.div>
);

const Card = ({ children, style = {} }) => (
    <div style={{ borderRadius: 20, background: 'var(--app-surface)', border: '1px solid var(--app-border)', backdropFilter: 'blur(12px)', padding: 22, position: 'relative', overflow: 'hidden', ...style }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
        {children}
    </div>
);

const TABS = [
    { id: 'overview', label: 'Overview', icon: '🏋️' },
    { id: 'workouts', label: 'Workouts', icon: '💪' },
    { id: 'habits', label: 'Habits', icon: '🔁' },
    { id: 'ai', label: 'AI Coach', icon: '🤖' },
];
const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Running', 'Cycling', 'Swimming', 'Sports', 'Other'];
const WORKOUT_EMOJIS = { Strength: '🏋️', Cardio: '❤️', HIIT: '⚡', Yoga: '🧘', Running: '🏃', Cycling: '🚴', Swimming: '🏊', Sports: '⚽', Other: '💪' };

export default function Fitness() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    return (
        <div className="page-shell">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 28 }}>
                <div className="page-tag"><FiActivity size={10} /> Fitness</div>
                <h1 className="page-title">Fitness Hub</h1>
                <p className="page-desc">Log workouts, build habits, and get personalised coaching from your AI fitness partner.</p>
            </motion.div>
            <div className="module-tabs" style={{ marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`module-tab${tab === t.id ? ' active' : ''}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
                    {tab === 'overview' && <FitnessOverview userId={user.id} />}
                    {tab === 'workouts' && <WorkoutLog userId={user.id} />}
                    {tab === 'habits' && <HabitTracker userId={user.id} module="fitness" />}
                    {tab === 'ai' && <AIFitnessCoach userId={user.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function StatRing({ value, max, color, size = 100, label, valueSuffix = '' }) {
    const r = size / 2 - 10;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(1, value / max);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                        <linearGradient id={`ring${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="100%" stopColor="#00e5ff" />
                        </linearGradient>
                    </defs>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke={`url(#ring${color.replace('#', '')})`}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - circ * pct }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Orbitron, monospace', color, lineHeight: 1 }}>
                        {value}{valueSuffix}
                    </span>
                </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', fontWeight: 600 }}>{label}</span>
        </div>
    );
}

function FitnessOverview({ userId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOverview = useCallback(() => {
        (async () => {
            const thisMonth = new Date(); thisMonth.setDate(1);
            const [wRes, hRes] = await Promise.all([
                supabase.from('workouts').select('*').eq('user_id', userId).gte('completed_at', thisMonth.toISOString().split('T')[0]),
                supabase.from('habits').select('completions,streak').eq('user_id', userId).eq('module', 'fitness'),
            ]);
            const workouts = wRes.data || [];
            const habits = hRes.data || [];
            const totalMins = workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);
            const maxStreak = habits.length ? Math.max(...habits.map(h => h.streak || 0)) : 0;
            const today = new Date().toISOString().split('T')[0];
            const todayDone = habits.filter(h => (h.completions || []).includes(today)).length;

            // Type breakdown
            const typeBreakdown = {};
            workouts.forEach(w => { typeBreakdown[w.type] = (typeBreakdown[w.type] || 0) + 1; });

            setData({ workoutCount: workouts.length, totalMins, maxStreak, todayHabits: todayDone, totalHabits: habits.length, recent: workouts.slice(0, 4), typeBreakdown });
            setLoading(false);
        })();
    }, [userId]);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useRealtimeRefresh('workouts', userId, fetchOverview);
    useRealtimeRefresh('habits', userId, fetchOverview);

    if (loading) return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 18 }} />)}
        </div>
    );

    if (!data.workoutCount && !data.totalHabits) return (
        <div className="empty-state">
            <div className="empty-state-icon">🏋️</div>
            <div className="empty-state-title">Start your fitness journey</div>
            <div className="empty-state-desc">Log your first workout or add fitness habits to get started.</div>
        </div>
    );

    return (
        <div>
            {/* Stat rings row */}
            <Card style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 22 }}>
                    📊 Monthly Stats
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
                    <StatRing value={data.workoutCount} max={20} color="#7c3aed" label="Workouts" />
                    <StatRing value={Math.round(data.totalMins / 60 * 10) / 10} max={40} color="#00e5ff" label="Hours trained" valueSuffix="h" />
                    <StatRing value={data.maxStreak} max={30} color="#fbbf24" label="Top streak" valueSuffix="d" />
                    <StatRing value={data.todayHabits} max={Math.max(data.totalHabits, 1)} color="#10b981" label={`Habits today`} />
                </div>
            </Card>

            {/* Type breakdown */}
            {Object.keys(data.typeBreakdown || {}).length > 0 && (
                <Card style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        💪 Workout Types
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {Object.entries(data.typeBreakdown).sort((a, b) => b[1] - a[1]).map(([type, cnt]) => (
                            <motion.div key={type} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.06, y: -2 }}
                                style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ fontSize: 18 }}>{WORKOUT_EMOJIS[type] || '💪'}</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{type}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{cnt}x</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Recent workouts */}
            {data.recent.length > 0 && (
                <Card>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>📋 Recent Workouts</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.recent.map((w, i) => (
                            <motion.div key={w.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                whileHover={{ x: 4 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--app-border)', transition: 'all 0.2s' }}>
                                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                    {WORKOUT_EMOJIS[w.type] || '💪'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{w.name}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}>{w.type}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{w.completed_at}</span>
                                    </div>
                                </div>
                                {w.duration_minutes && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 900, color: '#00e5ff' }}>{w.duration_minutes}</span>
                                        <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>MIN</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function WorkoutLog({ userId }) {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'Strength', duration_minutes: '', notes: '', exercises: '', completed_at: new Date().toISOString().split('T')[0] });

    const fetchWorkouts = useCallback(() => {
        supabase.from('workouts').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(30)
            .then(({ data }) => { setWorkouts(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);
    useRealtimeRefresh('workouts', userId, fetchWorkouts);

    const addWorkout = async () => {
        if (!form.name.trim()) return;
        const { data, error } = await supabase.from('workouts').insert({ user_id: userId, ...form, duration_minutes: parseInt(form.duration_minutes) || null }).select().single();
        if (!error && data) setWorkouts(w => [data, ...w]);
        setForm({ name: '', type: 'Strength', duration_minutes: '', notes: '', exercises: '', completed_at: new Date().toISOString().split('T')[0] }); setAdding(false);
    };
    const del = async (id) => { await supabase.from('workouts').delete().eq('id', id); setWorkouts(ws => ws.filter(w => w.id !== id)); };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                <AnimatePresence>
                    {!adding ? (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAdding(true)} className="btn-add" whileHover={{ scale: 1.02 }}>
                            <FiPlus size={14} /> Log Workout
                        </motion.button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card style={{ padding: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addWorkout()} placeholder="Workout name" autoFocus className="app-input" />
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="app-select">
                                        {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    <input value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="Duration (mins)" type="number" className="app-input" />
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <textarea value={form.exercises} onChange={e => setForm(f => ({ ...f, exercises: e.target.value }))} placeholder="Exercises (e.g. Bench Press 3x10, Squats 4x12...)" className="app-input" style={{ minHeight: 60, resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="app-input" />
                                    <input type="date" value={form.completed_at} onChange={e => setForm(f => ({ ...f, completed_at: e.target.value }))} className="app-input" style={{ colorScheme: 'dark' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={addWorkout} className="btn-save">Log Workout</button>
                                    <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!workouts.length ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💪</div>
                    <div className="empty-state-title">No workouts logged yet</div>
                    <div className="empty-state-desc">Start tracking your fitness journey.</div>
                    <button onClick={() => setAdding(true)} className="btn-add">Log First Workout</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AnimatePresence>
                        {workouts.map((w, i) => (
                            <motion.div key={w.id}
                                initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i > 10 ? 0 : i * 0.04 }}
                                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, background: 'var(--app-surface)', border: '1px solid var(--app-border)', transition: 'all 0.2s' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                    {WORKOUT_EMOJIS[w.type] || '💪'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{w.name}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontWeight: 600 }}>{w.type}</span>
                                        {w.duration_minutes && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,229,255,0.08)', color: '#00e5ff', fontWeight: 600 }}>{w.duration_minutes} min</span>}
                                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{w.completed_at}</span>
                                    </div>
                                    {w.notes && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5, fontStyle: 'italic' }}>{w.notes}</div>}
                                    {w.exercises && (
                                        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                                            <strong>Exercises:</strong><br />{w.exercises}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => del(w.id)} className="btn-danger"><FiTrash2 size={13} /></button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function AIFitnessCoach({ userId }) {
    const [q, setQ] = useState('');
    const [res, setRes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('ai_history').select('response').eq('user_id', userId).eq('module', 'fitness').order('created_at', { ascending: false }).limit(1).single()
            .then(({ data }) => { if (data) setRes(data.response); });
    }, [userId]);

    const generate = async () => {
        if (!q.trim()) return;
        setLoading(true); setRes('');
        const { data: recent } = await supabase.from('workouts').select('name,type,duration_minutes,exercises').eq('user_id', userId).order('completed_at', { ascending: false }).limit(5);
        const ctx = recent?.length ? `Recent workouts: ${recent.map(w => `${w.name} (${w.type}, ${w.duration_minutes}min)${w.exercises ? ` - Exercises: ${w.exercises}` : ''}`).join(' | ')}.` : 'No workout history yet.';
        const customPrompt = `${SYSTEM_PROMPTS.fitness}\n\nWhen providing advice, include specific "Easy vs Hard" effort comparisons for exercises and suggest alternatives where appropriate. Always aim for a professional, futuristic, and motivating tone.`;
        const { text, error } = await callGemini(`${ctx}\n\nFitness question: "${q}"`, customPrompt);
        if (!error && text) {
            setRes(text);
            await supabase.from('ai_history').insert({
                user_id: userId,
                module: 'fitness',
                prompt: q,
                response: text
            });
        } else {
            setRes(error ? `⚠️ ${error}` : '');
        }
        setLoading(false);
    };

    const prompts = ['Create a 4-week beginner workout plan', 'How do I improve my running endurance?', 'Best exercises to build core strength', 'How many rest days should I take?'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 36, marginBottom: 14, filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.4))' }}>🏋️</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>AI Fitness Coach</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>Get tailored advice based on your workout history and fitness goals.</p>
                <textarea value={q} onChange={e => setQ(e.target.value)} placeholder="Ask your AI coach..." rows={4} className="app-input" style={{ resize: 'vertical', lineHeight: 1.7, marginBottom: 16 }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generate} disabled={loading || !q.trim()}
                    style={{ padding: '13px', width: '100%', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: q.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: loading || !q.trim() ? 0.6 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                    {loading ? <><Spinner /> Coaching...</> : <><FiZap /> Get Coaching</>}
                </motion.button>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Quick prompts</div>
                    {prompts.map((p, i) => (
                        <motion.button key={i} onClick={() => setQ(p)} whileHover={{ x: 4 }}
                            style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.18s' }}>
                            💡 {p}
                        </motion.button>
                    ))}
                </div>
            </Card>
            <Card>
                {res ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💪</div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Coaching Advice</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{res}</div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40, opacity: 0.45 }}>
                        <span style={{ fontSize: 52, marginBottom: 16 }}>🏃</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Your coaching advice will appear here</div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Ask a question on the left</div>
                    </div>
                )}
            </Card>
        </div>
    );
}
