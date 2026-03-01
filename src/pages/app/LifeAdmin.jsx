import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiPlus, FiTrash2, FiCheck, FiSettings, FiBriefcase, FiAperture, FiAlertTriangle, FiAlertCircle, FiClock, FiZap, FiRefreshCw, FiShieldOff, FiX } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const ACCENT = '#8b5cf6';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f59e0b', Medium: '#8b5cf6', Low: '#64748b' };
const CATEGORIES = ['Routine', 'Document', 'Subscription', 'Bill', 'Health', 'Vehicle', 'Event'];
const RECURRENCES = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function getIcon(category) {
    switch (category) {
        case 'Routine': return <FiAperture size={16} />;
        case 'Document': return <FiFileText size={16} />;
        case 'Vehicle': return <FiBriefcase size={16} />;
        default: return <FiSettings size={16} />;
    }
}

// Helper to calculate the next date based on recurrence
function calculateNextDate(dateStr, recurrence) {
    if (!dateStr || recurrence === 'None') return null;
    const d = new Date(dateStr + 'T00:00:00');
    if (recurrence === 'Daily') d.setDate(d.getDate() + 1);
    if (recurrence === 'Weekly') d.setDate(d.getDate() + 7);
    if (recurrence === 'Monthly') d.setMonth(d.getMonth() + 1);
    if (recurrence === 'Yearly') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
}

export default function LifeAdmin() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('Active'); // Defaults to Active now
    const [aiLoading, setAiLoading] = useState(null);

    // Smart Parse State
    const [showParser, setShowParser] = useState(false);
    const [parseRawText, setParseRawText] = useState('');

    const [formData, setFormData] = useState({
        title: '', category: 'Routine', due_date: '', priority: 'Medium', notes: '', recurrence: 'None', color: ACCENT
    });

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('life_admin').select('*').eq('user_id', user?.id).order('due_date', { ascending: true, nullsFirst: false });
        if (error) { console.error(error); setTasks([]); }
        else setTasks(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchTasks(); }, [user, fetchTasks]);
    useRealtimeRefresh('life_admin', user?.id, fetchTasks);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;

        const payload = {
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            due_date: formData.due_date || null,
            priority: formData.priority,
            notes: formData.notes || null,
            color: formData.color,
            completed: false,
            // We include recurrence, assuming the SQL column is added later
            recurrence: formData.recurrence
        };

        const { data, error } = await supabase.from('life_admin').insert(payload).select().single();
        if (!error && data) {
            setTasks(prev => [...prev, data].sort((a, b) => (a.due_date || '9999') > (b.due_date || '9999') ? 1 : -1));
            setShowForm(false);
            setFormData({ title: '', category: 'Routine', due_date: '', priority: 'Medium', notes: '', recurrence: 'None', color: ACCENT });
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('life_admin').delete().eq('id', id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const toggleCompletion = async (task) => {
        const isFinishing = !task.completed;
        await supabase.from('life_admin').update({ completed: isFinishing }).eq('id', task.id);

        // Recurring logic: clone the task for the next cycle if completing it
        if (isFinishing && task.recurrence && task.recurrence !== 'None') {
            const nextDate = calculateNextDate(task.due_date, task.recurrence);
            // Optionally clear ai_consequence for the cloned task
            const clone = { ...task, id: undefined, created_at: undefined, completed: false, due_date: nextDate, ai_consequence: null };
            const { data } = await supabase.from('life_admin').insert(clone).select().single();
            if (data) setTasks(ts => [...ts.map(t => t.id === task.id ? { ...t, completed: isFinishing } : t), data].sort((a, b) => (a.due_date || '9999') > (b.due_date || '9999') ? 1 : -1));
        } else {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: isFinishing } : t));
        }
    };

    const handleSmartParse = async () => {
        if (!parseRawText.trim()) return;
        setAiLoading('parser');
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Extract task entity from this text: "${parseRawText}". 
            Return ONLY a JSON matching exactly:
            {"title": "short actionable title", "category": "Routine|Document|Subscription|Bill|Health|Vehicle|Event", "due_date": "YYYY-MM-DD" or null if none mentioned, "priority": "Critical|High|Medium|Low", "notes": "brief summary of the rest of the text"}
            Infer reasonable category and priority.`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(text);

            setFormData({
                ...formData,
                title: parsed.title || formData.title,
                category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Document',
                due_date: parsed.due_date || formData.due_date,
                priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium',
                notes: parsed.notes || formData.notes
            });
            setShowParser(false);
            setParseRawText('');
            // Form is now pre-filled!
        } catch (e) {
            console.error("Parse Failed", e);
            alert("Failed to parse document format.");
        }
        setAiLoading(null);
    };

    const generateConsequence = async (task) => {
        setAiLoading(task.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Task: "${task.title}". Category: ${task.category}. Priority: ${task.priority}.
            You are a ruthless Consequence Engine. State exactly what the real-world negative punishment/consequence is if the user fails to do this task on time. Be specific (e.g., late fees, credit score drop, legal issues). 
            Return ONLY 2 sentences of brutal reality. No markdown formatting.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/\*\*/g, '');

            await supabase.from('life_admin').update({ ai_consequence: text }).eq('id', task.id);
            setTasks(tasks.map(t => t.id === task.id ? { ...t, ai_consequence: text } : t));
        } catch (e) { console.error(e); }
        setAiLoading(null);
    };

    const overdueItems = tasks.filter(t => !t.completed && t.due_date && getDaysLeft(t.due_date) < 0);
    const upcomingItems = tasks.filter(t => !t.completed && t.due_date && getDaysLeft(t.due_date) >= 0 && getDaysLeft(t.due_date) <= 7);
    const filtered = filter === 'All' ? tasks : filter === 'Active' ? tasks.filter(t => !t.completed) : tasks.filter(t => t.completed);

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.25 }}>
                <ParticleCanvas count={25} speed={0.3} color={ACCENT} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiFileText size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #c4b5fd, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Life Administration
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • Smart extraction, recursions & consequence engine</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'New Entry'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    {/* Alert Banners */}
                    {overdueItems.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
                            <FiAlertTriangle size={16} color="#ef4444" />
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{overdueItems.length} Overdue Item{overdueItems.length > 1 ? 's' : ''}: </span>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{overdueItems.map(i => i.title).join(', ')}</span>
                            </div>
                        </motion.div>
                    )}
                    {upcomingItems.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 16 }}>
                            <FiAlertCircle size={16} color="#f59e0b" />
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{upcomingItems.length} Due within 7 days: </span>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{upcomingItems.map(i => i.title).join(', ')}</span>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }} className="glass-card"
                                style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, margin: 0 }}><FiFileText /> Manual Entry</h3>
                                    <button onClick={() => setShowParser(!showParser)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                        <FiZap size={14} /> AI Smart Parse
                                    </button>
                                </div>

                                {/* Smart Parser Collapse */}
                                <AnimatePresence>
                                    {showParser && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 0, marginBottom: 12 }}>Paste an email, letter, or chaotic text block below. The AI will extract the task title, dates, and priorities automatically.</p>
                                                <textarea className="app-input" value={parseRawText} onChange={e => setParseRawText(e.target.value)} rows={4} placeholder="e.g. Dear Sam, your vehicle registration expires on May 4th. Penalty fees apply after..." style={{ width: '100%', marginBottom: 12, fontSize: 13 }} />
                                                <button onClick={handleSmartParse} disabled={aiLoading === 'parser'} className="btn-primary" style={{ background: '#7c3aed', border: 'none', padding: '6px 14px' }}>
                                                    {aiLoading === 'parser' ? <FiZap className="spin" /> : 'Parse Document'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Entry Title *</label>
                                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Renew Car Insurance" />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Priority</label>
                                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) 2fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Due / Renewal Date</label>
                                            <input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Auto-Recurrence <FiRefreshCw strokeWidth={3} size={10} style={{ marginLeft: 4, color: '#10b981' }} /></label>
                                            <select value={formData.recurrence} onChange={e => setFormData({ ...formData, recurrence: e.target.value })}>
                                                {RECURRENCES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Notes (optional)</label>
                                            <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Policy #AB1234" />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: ACCENT, border: 'none' }}>
                                        Log Entry
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Filter Tabs */}
                    {tasks.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                            {['All', 'Active', 'Completed'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: filter === f ? ACCENT : 'rgba(255,255,255,0.05)', border: `1px solid ${filter === f ? ACCENT : 'rgba(255,255,255,0.1)'}`, color: filter === f ? 'white' : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
                            ))}
                            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
                        </div>
                    )}

                    {loading && tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiZap className="spin" /> Processing records...</div>
                    ) : tasks.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiFileText size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>No Admin Entries</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Add First Entry</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <AnimatePresence>
                                {filtered.map(task => {
                                    const days = getDaysLeft(task.due_date);
                                    const pColor = PRIORITY_COLORS[task.priority] || ACCENT;
                                    const urgencyColor = task.completed ? '#10b981' : days === null ? 'var(--text-3)' : days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#10b981';

                                    return (
                                        <motion.div key={task.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, height: 0 }}
                                            className="glass-card" style={{ padding: 0, opacity: task.completed ? 0.6 : 1, borderLeft: `4px solid ${pColor}`, overflow: 'hidden' }}>

                                            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                {/* Checkbox */}
                                                <button onClick={() => toggleCompletion(task)} style={{ width: 22, height: 22, marginTop: 2, borderRadius: 6, flexShrink: 0, border: `2px solid ${task.completed ? '#10b981' : 'rgba(255,255,255,0.2)'}`, background: task.completed ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    {task.completed && <FiCheck size={12} color="white" />}
                                                </button>

                                                {/* Content */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                        <h3 style={{ margin: 0, color: task.completed ? 'var(--text-3)' : 'white', fontSize: 16, fontWeight: 700, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</h3>
                                                        <span style={{ fontSize: 10, fontWeight: 800, color: pColor, background: `${pColor}18`, border: `1px solid ${pColor}40`, padding: '1px 8px', borderRadius: 100, textTransform: 'uppercase' }}>{task.priority}</span>
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.05)', padding: '1px 8px', borderRadius: 100 }}>{getIcon(task.category)} {task.category}</span>

                                                        {task.recurrence && task.recurrence !== 'None' && !task.completed && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 8px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <FiRefreshCw size={10} /> {task.recurrence}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
                                                        {task.due_date && (
                                                            <span style={{ fontSize: 11, color: urgencyColor, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                                                <FiClock size={11} />
                                                                {task.completed ? `Done · was ${new Date(task.due_date + 'T00:00:00').toLocaleDateString()}` : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due in ${days}d (${new Date(task.due_date + 'T00:00:00').toLocaleDateString()})`}
                                                            </span>
                                                        )}
                                                        {task.notes && <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>"{task.notes}"</span>}
                                                    </div>

                                                    {/* AI Consequence Box */}
                                                    {task.ai_consequence && !task.completed && (
                                                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderLeft: '3px solid #ef4444', borderRadius: '0 8px 8px 0' }}>
                                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><FiShieldOff size={11} /> Consequence Engine</div>
                                                            <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{task.ai_consequence}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                                                    {!task.completed && (
                                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => generateConsequence(task)} disabled={aiLoading === task.id}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                                                            {aiLoading === task.id ? <FiZap className="spin" /> : <FiAlertTriangle />} Analyze Risk
                                                        </motion.button>
                                                    )}
                                                    <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} className="hover-text-red">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
