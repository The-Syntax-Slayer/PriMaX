import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckSquare, FiPlus, FiTrash2, FiZap, FiRotateCcw, FiTarget, FiX, FiClock, FiEdit3, FiCheck } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, SYSTEM_PROMPTS } from '../../lib/aiService';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const COLS = [
    { id: 'todo', label: 'To Do', color: '#5a5a80', bg: 'rgba(90,90,128,0.08)' },
    { id: 'inprogress', label: 'In Progress', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    { id: 'done', label: 'Done', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
];
const PRIORITIES = { low: '#10b981', medium: '#fbbf24', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} style={{ display: 'inline-flex', color: '#7c3aed' }}>
        <FiRotateCcw size={14} />
    </motion.div>
);

const Card = ({ children, style = {} }) => (
    <div style={{ borderRadius: 18, background: 'var(--app-surface)', border: '1px solid var(--app-border)', backdropFilter: 'blur(12px)', padding: 20, position: 'relative', overflow: 'hidden', ...style }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
        {children}
    </div>
);

const TABS = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'focus', label: 'Focus', icon: '⏱️' },
    { id: 'habits', label: 'Habits', icon: '🔁' },
    { id: 'ai', label: 'AI Plan', icon: '🤖' },
];

export default function Productivity() {
    const { user } = useAuth();
    const [tab, setTab] = useState('tasks');
    return (
        <div className="page-shell">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 28 }}>
                <div className="page-tag"><FiCheckSquare size={10} /> Productivity</div>
                <h1 className="page-title">Productivity Workspace</h1>
                <p className="page-desc">Organise tasks, track habits, enter deep work, and let AI plan your day.</p>
            </motion.div>

            {/* Tabs */}
            <div className="module-tabs" style={{ marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`module-tab${tab === t.id ? ' active' : ''}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
                    {tab === 'tasks' && <KanbanBoard userId={user.id} />}
                    {tab === 'focus' && <FocusTimer />}
                    {tab === 'habits' && <HabitTracker userId={user.id} module="productivity" />}
                    {tab === 'ai' && <AIPlanner userId={user.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function KanbanBoard({ userId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ title: '', priority: 'medium', due_date: '' });
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const fetchTasks = useCallback(() => {
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            .then(({ data }) => { setTasks(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);
    useRealtimeRefresh('tasks', userId, fetchTasks);

    const addTask = async () => {
        if (!form.title.trim()) return;
        const { data, error } = await supabase.from('tasks').insert({ user_id: userId, ...form, status: 'todo' }).select().single();
        if (!error && data) setTasks(t => [data, ...t]);
        setForm({ title: '', priority: 'medium', due_date: '' }); setAdding(false);
    };
    const moveTask = async (id, status) => {
        await supabase.from('tasks').update({ status }).eq('id', id);
        setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    };
    const deleteTask = async (id) => {
        await supabase.from('tasks').delete().eq('id', id);
        setTasks(ts => ts.filter(t => t.id !== id));
    };
    const updateTaskTitle = async (id) => {
        if (!editValue.trim()) { setEditingId(null); return; }
        await supabase.from('tasks').update({ title: editValue.trim() }).eq('id', id);
        setTasks(ts => ts.map(t => t.id === id ? { ...t, title: editValue.trim() } : t));
        setEditingId(null);
    };
    const clearCompleted = async () => {
        const doneTasks = tasks.filter(t => t.status === 'done');
        if (!doneTasks.length) return;
        if (!window.confirm(`Clear all ${doneTasks.length} completed tasks?`)) return;
        await supabase.from('tasks').delete().eq('status', 'done').eq('user_id', userId);
        setTasks(ts => ts.filter(t => t.status !== 'done'));
    };

    if (loading) return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <div className="skeleton" style={{ width: 80, height: 18, marginBottom: 16 }} />
                    {[1, 2].map(j => <div key={j} className="skeleton" style={{ height: 70, borderRadius: 12, marginBottom: 10 }} />)}
                </Card>
            ))}
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                <AnimatePresence>
                    {!adding ? (
                        <motion.button
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            onClick={() => setAdding(true)}
                            className="btn-add"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        >
                            <FiPlus size={14} /> Add Task
                        </motion.button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card style={{ padding: 18 }}>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && addTask()}
                                    placeholder="What needs to be done?"
                                    autoFocus
                                    className="app-input"
                                    style={{ marginBottom: 12 }}
                                />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="app-select" style={{ flex: 1 }}>
                                        <option value="low">🟢 Low Priority</option>
                                        <option value="medium">🟡 Medium Priority</option>
                                        <option value="high">🔴 High Priority</option>
                                    </select>
                                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="app-input" style={{ flex: 1, colorScheme: 'dark' }} />
                                    <button onClick={addTask} className="btn-save">Add</button>
                                    <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!tasks.length && !adding ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-title">Your workspace is clear</div>
                    <div className="empty-state-desc">Add your first task to get started on your goals.</div>
                    <button onClick={() => setAdding(true)} className="btn-add">Add a Task</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    {COLS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id}>
                                {/* Column header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 10, background: col.bg, border: `1px solid ${col.color}22` }}>
                                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: col.color, boxShadow: `0 0 8px ${col.color}88` }} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{col.label}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 11, color: col.color, background: `${col.color}18`, padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>{colTasks.length}</span>
                                    {col.id === 'done' && colTasks.length > 0 && (
                                        <button onClick={clearCompleted} title="Clear completed" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <FiTrash2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 80 }}>
                                    {colTasks.length === 0 && (
                                        <div style={{ padding: '20px', textAlign: 'center', borderRadius: 14, border: `1px dashed ${col.color}22`, color: 'var(--text-3)', fontSize: 12 }}>
                                            Empty
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {colTasks.map(t => (
                                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                                <motion.div
                                                    whileHover={{ y: -2, boxShadow: `0 8px 30px rgba(0,0,0,0.2)` }}
                                                    style={{ padding: '14px', borderRadius: 14, background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderLeft: `3px solid ${PRIORITIES[t.priority] || '#5a5a80'}`, transition: 'all 0.2s' }}
                                                >
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text-1)', textDecoration: t.status === 'done' ? 'line-through' : 'none', marginBottom: 10, lineHeight: 1.5, cursor: 'text' }}>
                                                        {editingId === t.id ? (
                                                            <input
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                onBlur={() => updateTaskTitle(t.id)}
                                                                onKeyDown={e => e.key === 'Enter' && updateTaskTitle(t.id)}
                                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid #7c3aed', color: 'var(--text-1)', outline: 'none', fontSize: 13, padding: '2px 0' }}
                                                            />
                                                        ) : (
                                                            <span onClick={() => { setEditingId(t.id); setEditValue(t.title); }}>{t.title}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: `${PRIORITIES[t.priority]}15`, color: PRIORITIES[t.priority], fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{PRIORITY_LABELS[t.priority]}</span>
                                                        {t.due_date && <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><FiClock size={9} />{t.due_date}</span>}
                                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                                                            {COLS.filter(c => c.id !== col.id).slice(0, 1).map(c => (
                                                                <button key={c.id} onClick={() => moveTask(t.id, c.id)}
                                                                    style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: `${c.color}14`, border: `1px solid ${c.color}28`, color: c.color, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
                                                                    → {c.label}
                                                                </button>
                                                            ))}
                                                            <button onClick={() => deleteTask(t.id)} className="btn-danger" style={{ padding: '3px 6px' }}><FiTrash2 size={10} /></button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FocusTimer() {
    const MODES = [{ label: 'Focus', mins: 25, color: '#7c3aed', emoji: '🎯' }, { label: 'Short Break', mins: 5, color: '#10b981', emoji: '☕' }, { label: 'Long Break', mins: 15, color: '#00e5ff', emoji: '🌿' }];
    const [modeIdx, setModeIdx] = useState(0);
    const [secs, setSecs] = useState(MODES[0].mins * 60);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [editingMins, setEditingMins] = useState(false);
    const [customMins, setCustomMins] = useState('25');
    const { user } = useAuth();
    const intervalRef = useRef(null);

    const fetchSessions = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('focus_sessions').select('id').eq('user_id', user.id).gte('completed_at', today);
        setSessions(data?.length || 0);
    }, [user.id]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const logSession = async (mins, mode) => {
        await supabase.from('focus_sessions').insert({
            user_id: user.id,
            duration_minutes: mins,
            mode: mode.id || mode.label.toLowerCase().replace(' ', '_'),
            completed_at: new Date().toISOString()
        });
        setSessions(s => s + 1);
    };

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => setSecs(s => {
                if (s <= 1) {
                    clearInterval(intervalRef.current);
                    setRunning(false);
                    if (modeIdx === 0) logSession(MODES[modeIdx].mins, MODES[modeIdx]);
                    return 0;
                }
                return s - 1;
            }), 1000);
        } else clearInterval(intervalRef.current);
        return () => clearInterval(intervalRef.current);
    }, [running, modeIdx]);

    const selectMode = (i) => { setModeIdx(i); setSecs(MODES[i].mins * 60); setRunning(false); };
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const sec = String(secs % 60).padStart(2, '0');
    const pct = secs / (MODES[modeIdx].mins * 60);
    const r = 88;
    const circ = 2 * Math.PI * r;
    const mode = MODES[modeIdx];

    const handleCustomSubmit = (e) => {
        if (e.key === 'Enter') {
            const m = parseInt(customMins);
            if (m > 0 && m < 120) {
                setSecs(m * 60);
                setEditingMins(false);
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Card style={{ padding: 28, textAlign: 'center', background: `linear-gradient(180deg, var(--app-surface), ${MODES[modeIdx].color}05)`, border: `1px solid ${MODES[modeIdx].color}22`, maxWidth: 440, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
                    {MODES.map((m, i) => (
                        <button key={m.label} onClick={() => selectMode(i)}
                            style={{ padding: '8px 16px', borderRadius: 10, background: modeIdx === i ? `${m.color}15` : 'transparent', border: `1px solid ${modeIdx === i ? m.color : 'transparent'}`, color: modeIdx === i ? m.color : 'var(--text-3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {m.emoji} {m.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 28px' }}>
                    <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                        <motion.circle cx="100" cy="100" r={r} fill="none" stroke={MODES[modeIdx].color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} animate={{ strokeDashoffset: circ * (1 - pct) }} transition={{ duration: 1, ease: 'linear' }} style={{ filter: `drop-shadow(0 0 8px ${MODES[modeIdx].color}44)` }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {editingMins ? (
                            <input
                                autoFocus
                                value={customMins}
                                onChange={e => setCustomMins(e.target.value)}
                                onKeyDown={handleCustomSubmit}
                                onBlur={() => setEditingMins(false)}
                                style={{ width: 80, background: 'transparent', border: 'none', borderBottom: `2px solid ${MODES[modeIdx].color}`, color: 'var(--text-1)', fontSize: 42, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'Orbitron, monospace' }}
                            />
                        ) : (
                            <div onClick={() => setEditingMins(true)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--text-1)', fontFamily: 'Orbitron, monospace' }}>
                                    {mins}:{sec}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.1em', marginTop: -4 }}>CLICK TO EDIT</div>
                            </div>
                        )}
                    </div>
                </div>

                {sessions > 0 && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
                        {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                                style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px rgba(124,58,237,0.6)' }} />
                        ))}
                        <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 6 }}>{sessions} sessions</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setRunning(r => !r)}
                        style={{ padding: '15px 44px', borderRadius: 16, background: running ? 'rgba(255,255,255,0.07)' : `linear-gradient(135deg,${mode.color},#00e5ff)`, border: running ? `1px solid ${mode.color}40` : 'none', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: running ? 'none' : `0 6px 30px ${mode.color}44` }}
                    >
                        {running ? '⏸ Pause' : secs === MODES[modeIdx].mins * 60 ? '▶ Start' : '▶ Resume'}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setSecs(MODES[modeIdx].mins * 60); setRunning(false); }}
                        style={{ padding: '15px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', color: 'var(--text-3)', cursor: 'pointer' }}>
                        <FiRotateCcw size={18} />
                    </motion.button>
                </div>
            </Card>
        </div>
    );
}

export function HabitTracker({ userId, module = 'productivity' }) {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newHabit, setNewHabit] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const fetchHabits = useCallback(() => {
        supabase.from('habits').select('*').eq('user_id', userId).eq('module', module).order('created_at')
            .then(({ data }) => { setHabits(data || []); setLoading(false); });
    }, [userId, module]);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);
    useRealtimeRefresh('habits', userId, fetchHabits);

    const addHabit = async () => {
        if (!newHabit.trim()) return;
        const { data, error } = await supabase.from('habits').insert({ user_id: userId, name: newHabit.trim(), module }).select().single();
        if (!error && data) setHabits(h => [...h, data]);
        setNewHabit('');
    };

    const toggleHabit = async (habit) => {
        const isChecked = (habit.completions || []).includes(today);
        const newCompletions = isChecked ? habit.completions.filter(d => d !== today) : [...(habit.completions || []), today];
        const sorted = [...newCompletions].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0; let d = new Date();
        for (const ds of sorted) { const diff = Math.round((d - new Date(ds)) / 86400000); if (diff > 1) break; streak++; d = new Date(ds); }

        const { error } = await supabase.from('habits').update({ completions: newCompletions, streak }).eq('id', habit.id);

        if (!error && !isChecked) {
            // Push notification for habit completion
            await supabase.from('notifications').insert({
                user_id: userId,
                title: 'Habit Milestone!',
                message: `You completed "${habit.name}"! Current streak: ${streak} days. 🔥`,
                type: 'success'
            });
        }

        setHabits(hs => hs.map(h => h.id === habit.id ? { ...h, completions: newCompletions, streak } : h));
    };

    const deleteHabit = async (id) => {
        await supabase.from('habits').delete().eq('id', id);
        setHabits(hs => hs.filter(h => h.id !== id));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    const completedToday = habits.filter(h => (h.completions || []).includes(today)).length;

    return (
        <div>
            {/* Progress summary */}
            {habits.length > 0 && (
                <Card style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Today's Progress</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{completedToday} of {habits.length} habits done</div>
                        </div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900, color: completedToday === habits.length ? '#10b981' : '#7c3aed' }}>
                            {Math.round((completedToday / habits.length) * 100)}%
                        </div>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: `${habits.length ? (completedToday / habits.length) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #7c3aed, #10b981)' }}
                        />
                    </div>
                </Card>
            )}

            {/* Add habit input */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                    value={newHabit}
                    onChange={e => setNewHabit(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addHabit()}
                    placeholder="Add a new habit..."
                    className="app-input"
                    style={{ flex: 1 }}
                />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addHabit} className="btn-save">
                    <FiPlus size={14} />
                </motion.button>
            </div>

            {!habits.length ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔁</div>
                    <div className="empty-state-title">No habits tracked yet</div>
                    <div className="empty-state-desc">Build consistency by tracking daily habits.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AnimatePresence>
                        {habits.map((h, i) => {
                            const done = (h.completions || []).includes(today);
                            return (
                                <motion.div
                                    key={h.id}
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileHover={{ x: 3 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, background: done ? 'rgba(16,185,129,0.06)' : 'var(--app-surface)', border: `1px solid ${done ? 'rgba(16,185,129,0.22)' : 'var(--app-border)'}`, transition: 'all 0.25s' }}
                                >
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        whileHover={{ scale: 1.1 }}
                                        onClick={() => toggleHabit(h)}
                                        style={{ width: 30, height: 30, borderRadius: 9, background: done ? '#10b981' : 'rgba(255,255,255,0.04)', border: `2px solid ${done ? '#10b981' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: done ? '0 0 14px rgba(16,185,129,0.4)' : 'none', transition: 'all 0.25s' }}
                                    >
                                        <AnimatePresence>
                                            {done && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><FiCheck size={14} color="white" /></motion.div>}
                                        </AnimatePresence>
                                    </motion.button>
                                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: done ? 'var(--text-2)' : 'var(--text-1)', textDecoration: done ? 'line-through' : 'none', transition: 'all 0.22s' }}>{h.name}</span>
                                    {h.streak > 0 && (
                                        <motion.span
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ fontSize: 12, color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            🔥 {h.streak}d
                                        </motion.span>
                                    )}
                                    <button onClick={() => deleteHabit(h.id)} className="btn-danger"><FiTrash2 size={13} /></button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function AIPlanner({ userId }) {
    const [q, setQ] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('ai_history').select('response').eq('user_id', userId).eq('module', 'productivity').order('created_at', { ascending: false }).limit(1).single()
            .then(({ data }) => { if (data) setPlan(data.response); });
    }, [userId]);

    const generate = async () => {
        if (!q.trim()) return;
        setLoading(true); setPlan('');
        const { data: tasks } = await supabase.from('tasks').select('title,priority,status').eq('user_id', userId).neq('status', 'done').limit(10);
        const ctx = tasks?.length ? `Open tasks: ${tasks.map(t => `"${t.title}" (${t.priority})`).join(', ')}.` : 'No open tasks.';
        const { text, error } = await callGemini(`${ctx}\n\nUser: "${q}"`, SYSTEM_PROMPTS.productivity);
        if (!error && text) {
            setPlan(text);
            await supabase.from('ai_history').insert({
                user_id: userId,
                module: 'productivity',
                prompt: q,
                response: text
            });
        } else {
            setPlan(error ? `⚠️ ${error}` : '');
        }
        setLoading(false);
    };

    const prompts = ['Plan a focused day to finish my project', 'Help me prioritize my tasks for this week', 'Create a morning routine for maximum productivity', 'What should I tackle first today?'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 32, marginBottom: 14, filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.5))' }}>🤖</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>AI Daily Planner</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>Tell me what you want to accomplish. I'll use your real open tasks as context.</p>
                <textarea
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="e.g. Plan a focused day to finish my API..."
                    rows={4}
                    className="app-input"
                    style={{ resize: 'vertical', marginBottom: 16, lineHeight: 1.7 }}
                />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generate} disabled={loading || !q.trim()}
                    style={{ padding: '13px', width: '100%', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: q.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: loading || !q.trim() ? 0.6 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                    {loading ? <><Spinner /> Planning...</> : <><FiZap /> Plan My Day</>}
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
                {plan ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your AI Plan</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{plan}</div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40, opacity: 0.45 }}>
                        <span style={{ fontSize: 52, marginBottom: 16 }}>📅</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Your plan will appear here</div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Describe your goals on the left</div>
                    </div>
                )}
            </Card>
        </div>
    );
}
