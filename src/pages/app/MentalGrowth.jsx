import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiPlus, FiTrash2, FiZap, FiRotateCcw, FiX, FiEdit3, FiSave } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, SYSTEM_PROMPTS } from '../../lib/aiService';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { useCallback } from 'react';

const Spinner = () => <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ display: 'inline-flex' }}><FiRotateCcw size={13} /></motion.div>;
const Card = ({ children, style = {} }) => <div style={{ borderRadius: 16, background: 'var(--app-surface)', border: '1px solid var(--app-border)', padding: 20, ...style }}>{children}</div>;
const TABS = [
    { id: 'overview', label: 'Overview', icon: '🧠' },
    { id: 'journal', label: 'Journal', icon: '📓' },
    { id: 'mood', label: 'Mood', icon: '😊' },
    { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
    { id: 'ai', label: 'AI Guide', icon: '🤖' },
];
const MOODS = [
    { value: 1, icon: '😔', label: 'Struggling', color: '#ef4444' },
    { value: 2, icon: '😕', label: 'Low', color: '#f97316' },
    { value: 3, icon: '😐', label: 'Neutral', color: '#f59e0b' },
    { value: 4, icon: '🙂', label: 'Good', color: '#10b981' },
    { value: 5, icon: '😄', label: 'Great', color: '#00f5ff' },
];

export default function MentalGrowth() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    return (
        <div className="page-shell">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 24 }}>
                <div className="page-tag"><FiSun size={10} /> Mental Growth</div>
                <h1 className="page-title">Mental Growth Center</h1>
                <p className="page-desc">Journal, track your mood, practice gratitude, and grow with your AI mindset coach.</p>
            </motion.div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
                {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', border: tab === t.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent', background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#f0f0ff' : 'var(--text-3)', transition: 'all 0.2s' }}>{t.icon} {t.label}</button>)}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {tab === 'overview' && <MentalOverview userId={user.id} />}
                    {tab === 'journal' && <JournalTab userId={user.id} />}
                    {tab === 'mood' && <MoodTab userId={user.id} />}
                    {tab === 'gratitude' && <GratitudeTab userId={user.id} />}
                    {tab === 'ai' && <AIMindsetCoach userId={user.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function MentalOverview({ userId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchOverview = useCallback(() => {
        (async () => {
            const [jRes, mRes, gRes] = await Promise.all([
                supabase.from('journal_entries').select('id,title,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
                supabase.from('mood_logs').select('mood_value,logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(7),
                supabase.from('gratitude_entries').select('id').eq('user_id', userId),
            ]);
            const moods = mRes.data || [];
            const avgMood = moods.length ? (moods.reduce((s, m) => s + m.mood_value, 0) / moods.length).toFixed(1) : null;

            // Generate a random affirmation if not exists
            const affirmations = [
                "I am capable of achieving anything I set my mind to.",
                "Every challenge is an opportunity for growth.",
                "I radiate confidence, self-respect, and inner harmony.",
                "My mind is full of brilliant ideas and potential.",
                "I am becoming the best version of myself every single day."
            ];
            const dailyAff = affirmations[new Date().getDate() % affirmations.length];
            const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes') || '[]');

            setData({ journals: jRes.data || [], recentMoods: moods, avgMood, gratitudeCount: (gRes.data || []).length, dailyAff, savedQuotes });
            setLoading(false);
        })();
    }, [userId]);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useRealtimeRefresh('journal_entries', userId, fetchOverview);
    useRealtimeRefresh('mood_logs', userId, fetchOverview);
    useRealtimeRefresh('gratitude_entries', userId, fetchOverview);
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;
    if (!data.journals.length && !data.recentMoods.length && !data.gratitudeCount) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.7 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🧠</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Start your mental growth journey</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Write your first journal entry or log your mood to begin.</div>
        </div>
    );
    const moodObj = data.avgMood ? MOODS.find(m => m.value === Math.round(data.avgMood)) : null;
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Journal Entries', value: data.journals.length, color: '#7c3aed' },
                    { label: 'Avg Mood (7 days)', value: data.avgMood ? `${moodObj?.icon} ${data.avgMood}` : '–', color: moodObj?.color || '#5a5a80' },
                    { label: 'Gratitude Days', value: data.gratitudeCount, color: '#f59e0b' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: `${s.color}0c`, border: `1px solid ${s.color}20`, backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900, color: s.color }}>{s.value || 0}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Daily Affirmation */}
            <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,229,255,0.08))', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>✨ DAILY AFFIRMATION</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
                    "{data.dailyAff}"
                </div>
                <button
                    onClick={() => {
                        const newSaved = [...new Set([...data.savedQuotes, data.dailyAff])];
                        localStorage.setItem('saved_quotes', JSON.stringify(newSaved));
                        setData(d => ({ ...d, savedQuotes: newSaved }));
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-2)', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                    <FiSave size={12} /> {data.savedQuotes.includes(data.dailyAff) ? 'Saved to Collection' : 'Save to Collection'}
                </button>
            </Card>

            {/* Saved Quotes Collection */}
            {data.savedQuotes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Saved Wisdom</div>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: 12, paddingBottom: 8, scrollbarWidth: 'none' }}>
                        {data.savedQuotes.map((q, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ flexShrink: 0, width: 200, padding: 14, borderRadius: 12, background: 'var(--app-surface)', border: '1px solid var(--app-border)', fontSize: 11, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.4, position: 'relative' }}
                            >
                                "{q}"
                                <button
                                    onClick={() => {
                                        const newSaved = data.savedQuotes.filter((_, idx) => idx !== i);
                                        localStorage.setItem('saved_quotes', JSON.stringify(newSaved));
                                        setData(d => ({ ...d, savedQuotes: newSaved }));
                                    }}
                                    style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                                >
                                    <FiX size={10} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            {data.recentMoods.length > 0 && (
                <Card style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>📈 Futuristic Mood Trend</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 100, padding: '10px 0' }}>
                        {[...data.recentMoods].reverse().map((m, i) => {
                            const mo = MOODS.find(x => x.value === m.mood_value);
                            return <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${m.mood_value / 5 * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        width: '100%',
                                        background: `linear-gradient(to top, ${mo?.color}44, ${mo?.color})`,
                                        borderRadius: '8px 8px 4px 4px',
                                        minHeight: 12,
                                        boxShadow: `0 0 15px ${mo?.color}33`,
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 12 }}>{mo?.icon}</div>
                                </motion.div>
                                <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>{new Date(m.logged_at).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            </div>;
                        })}
                    </div>
                </Card>
            )}
            {data.journals.length > 0 && (
                <Card>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📓 Recent Journal Entries</div>
                    {data.journals.map(j => <div key={j.id} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--app-border)', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{j.title || 'Untitled entry'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{new Date(j.created_at).toLocaleDateString()}</div>
                    </div>)}
                </Card>
            )}
        </div>
    );
}

function JournalTab({ userId }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [writing, setWriting] = useState(false);
    const [form, setForm] = useState({ title: '', content: '' });
    const fetchEntries = useCallback(() => {
        supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            .then(({ data }) => { setEntries(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);
    useRealtimeRefresh('journal_entries', userId, fetchEntries);
    const save = async () => {
        if (!form.content.trim()) return;
        const { data, error } = await supabase.from('journal_entries').insert({ user_id: userId, title: form.title, content: form.content }).select().single();
        if (!error && data) { setEntries(e => [data, ...e]); setSelected(data); }
        setForm({ title: '', content: '' }); setWriting(false);
    };
    const del = async (id) => {
        await supabase.from('journal_entries').delete().eq('id', id);
        setEntries(es => es.filter(e => e.id !== id));
        if (selected?.id === id) setSelected(null);
    };
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, height: 600 }}>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => { setWriting(true); setSelected(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#f0f0ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
                    <FiPlus size={13} /> New Entry
                </button>
                {!entries.length && !writing && <div style={{ textAlign: 'center', padding: 20, opacity: 0.6, fontSize: 12, color: 'var(--text-2)' }}>No journal entries yet.<br />Write your first entry.</div>}
                {entries.map(e => (
                    <div key={e.id} onClick={() => { setSelected(e); setWriting(false); }}
                        style={{ padding: '12px 14px', borderRadius: 12, background: selected?.id === e.id ? 'rgba(124,58,237,0.12)' : 'var(--app-surface)', border: `1px solid ${selected?.id === e.id ? 'rgba(124,58,237,0.4)' : 'var(--app-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(e.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
            </div>
            <Card style={{ overflowY: 'auto', padding: 24 }}>
                {writing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Entry title (optional)" style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--app-border)', color: 'var(--text-1)', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 16, padding: '0 0 10px' }} />
                        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write freely... what's on your mind?" style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', lineHeight: 1.8, resize: 'none', outline: 'none' }} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, borderTop: '1px solid var(--app-border)', paddingTop: 16 }}>
                            <button onClick={save} style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save Entry</button>
                            <button onClick={() => setWriting(false)} style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-3)', cursor: 'pointer' }}><FiX size={13} /></button>
                        </div>
                    </div>
                ) : selected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--app-border)' }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{selected.title || 'Untitled'}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{new Date(selected.created_at).toLocaleString()}</div>
                            </div>
                            <button onClick={() => del(selected.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}><FiTrash2 size={15} /></button>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.85, whiteSpace: 'pre-wrap', flex: 1, overflowY: 'auto' }}>{selected.content}</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.5 }}>
                        <span style={{ fontSize: 44, marginBottom: 14 }}>📓</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Select an entry or write a new one</div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function MoodTab({ userId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const fetchLogs = useCallback(() => {
        supabase.from('mood_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(30)
            .then(({ data }) => { setLogs(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useRealtimeRefresh('mood_logs', userId, fetchLogs);
    const logMood = async () => {
        if (!selectedMood) return;
        setSaving(true);
        const { data, error } = await supabase.from('mood_logs').insert({ user_id: userId, mood_value: selectedMood, note: note.trim() || null }).select().single();
        if (!error && data) setLogs(l => [data, ...l]);
        setSelectedMood(null); setNote(''); setSaving(false);
    };
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;
    return (
        <div>
            <Card style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>How are you feeling right now?</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
                    {MOODS.map(m => (
                        <motion.button key={m.value} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedMood(m.value)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 16px', borderRadius: 14, background: selectedMood === m.value ? `${m.color}15` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${selectedMood === m.value ? m.color : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: 28 }}>{m.icon}</span>
                            <span style={{ fontSize: 11, color: selectedMood === m.value ? m.color : 'var(--text-3)', fontWeight: 600 }}>{m.label}</span>
                        </motion.button>
                    ))}
                </div>
                {selectedMood && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about how you're feeling... (optional)"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
                        <button onClick={logMood} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            {saving ? 'Logging...' : 'Log Mood'}
                        </button>
                    </motion.div>
                )}
            </Card>
            {!logs.length ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.6, fontSize: 13, color: 'var(--text-2)' }}>Log your first mood above to start tracking your emotional patterns.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logs.map(log => {
                        const m = MOODS.find(x => x.value === log.mood_value);
                        return (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
                                <span style={{ fontSize: 24 }}>{m?.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: m?.color }}>{m?.label}</div>
                                    {log.note && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{log.note}</div>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(log.logged_at).toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function GratitudeTab({ userId }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState(['', '', '']);
    const [saving, setSaving] = useState(false);
    const fetchGratitude = useCallback(() => {
        supabase.from('gratitude_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
            .then(({ data }) => { setEntries(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchGratitude(); }, [fetchGratitude]);
    useRealtimeRefresh('gratitude_entries', userId, fetchGratitude);
    const save = async () => {
        const filled = items.filter(i => i.trim());
        if (!filled.length) return;
        setSaving(true);
        const { data, error } = await supabase.from('gratitude_entries').insert({ user_id: userId, items: filled }).select().single();
        if (!error && data) setEntries(e => [data, ...e]);
        setItems(['', '', '']); setSaving(false);
    };
    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;
    return (
        <div>
            <Card style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>🙏 What are you grateful for today?</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>List 3 things you're grateful for right now.</p>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                        <input value={item} onChange={e => setItems(prev => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={`Gratitude ${i + 1}...`}
                            style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                    </div>
                ))}
                <button onClick={save} disabled={saving || !items.some(i => i.trim())} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
                    {saving ? 'Saving...' : '✨ Save Today\'s Gratitude'}
                </button>
            </Card>
            {!entries.length ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.6, fontSize: 13, color: 'var(--text-2)' }}>Start your gratitude practice above. Consistency builds a positive mindset.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {entries.map(e => (
                        <Card key={e.id} style={{ padding: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>{new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            {(e.items || []).map((item, i) => <div key={i} style={{ fontSize: 14, color: 'var(--text-1)', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: '#f59e0b', marginTop: 2 }}>✨</span>{item}</div>)}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function AIMindsetCoach({ userId }) {
    const [q, setQ] = useState('');
    const [res, setRes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const loadLast = async () => {
            const { data } = await supabase
                .from('ai_history')
                .select('output')
                .eq('user_id', userId)
                .eq('module', 'mental')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) setRes(data.output);
        };
        loadLast();
    }, [userId]);

    const generate = async () => {
        if (!q.trim()) return;
        setLoading(true);
        const { data: moods } = await supabase.from('mood_logs').select('mood_value').eq('user_id', userId).order('logged_at', { ascending: false }).limit(7);
        const avgMood = moods?.length ? (moods.reduce((s, m) => s + m.mood_value, 0) / moods.length).toFixed(1) : null;
        const ctx = avgMood ? `User's average mood this week: ${avgMood}/5. ` : '';
        const { text, error } = await callGemini(`${ctx}User message: "${q}"`, SYSTEM_PROMPTS.mental);

        if (!error && text) {
            setRes(text);
            await supabase.from('ai_history').insert({
                user_id: userId,
                module: 'mental',
                prompt: q,
                response: text
            });
        } else {
            setRes(error ? `⚠️ ${error}` : 'Failed to generate guidance');
        }
        setLoading(false);
    };
    const prompts = ['I\'m feeling overwhelmed and anxious', 'Help me build more self-discipline', 'How do I stay motivated during hard times?', 'I want to build a morning routine'];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>AI Mindset Coach</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 18 }}>Evidence-based guidance grounded in positive psychology and mindfulness.</p>
                <textarea value={q} onChange={e => setQ(e.target.value)} placeholder="What's on your mind?" rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', lineHeight: 1.7, resize: 'vertical', outline: 'none', marginBottom: 14 }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate} disabled={loading || !q.trim()} style={{ padding: '12px', width: '100%', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: q.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading || !q.trim() ? 0.6 : 1 }}>
                    {loading ? <><Spinner /> Thinking...</> : <><FiZap /> Get Guidance</>}
                </motion.button>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {prompts.map((p, i) => <button key={i} onClick={() => setQ(p)} style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>💡 {p}</button>)}
                </div>
            </Card>
            <Card>
                {res ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🌱 AI Guidance</div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{res}</div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 32, opacity: 0.5 }}>
                        <span style={{ fontSize: 44, marginBottom: 14 }}>🌿</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Your guidance will appear here</div>
                    </div>
                )}
            </Card>
        </div>
    );
}
