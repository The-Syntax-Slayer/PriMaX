import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiPlus, FiTrash2, FiCheckCircle, FiClock, FiActivity, FiZap, FiChevronDown, FiChevronUp, FiLink, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function DeadlineBadge({ dateStr }) {
    const days = getDaysLeft(dateStr);
    if (days === null) return null;
    const color = days < 0 ? '#ef4444' : days < 7 ? '#f59e0b' : '#10b981';
    const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
    return (
        <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}40`, padding: '2px 8px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiClock size={10} /> {label}
        </span>
    );
}

const ProgressRing = ({ progress, color, size = 64, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
                <motion.circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
            </svg>
            <div style={{ position: 'absolute', fontSize: 12, fontWeight: 900, color: 'white', fontFamily: 'Orbitron, monospace' }}>
                {progress}%
            </div>
        </div>
    );
};

export default function GoalPlanning() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [aiLoading, setAiLoading] = useState(null);
    const [predictingId, setPredictingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', target_date: '', priority: 'medium', color: '#ef4444', milestones: '', dependent_on_id: ''
    });

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('goals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        if (error) { console.error(error); setGoals([]); }
        else setGoals(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchGoals(); }, [user, fetchGoals]);
    useRealtimeRefresh('goals', user?.id, fetchGoals);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;
        const milestonesArr = formData.milestones
            ? formData.milestones.split('\n').filter(m => m.trim()).map(m => ({ text: m.trim(), done: false }))
            : [];
        const { data, error } = await supabase.from('goals').insert({
            user_id: user.id, title: formData.title, description: formData.description,
            target_date: formData.target_date || null, priority: formData.priority, color: formData.color,
            progress: 0, status: 'active', milestones: milestonesArr, dependent_on_id: formData.dependent_on_id || null
        }).select().single();
        if (!error && data) {
            setGoals([data, ...goals]);
            setShowForm(false);
            setFormData({ title: '', description: '', target_date: '', priority: 'medium', color: '#ef4444', milestones: '', dependent_on_id: '' });
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('goals').delete().eq('id', id);
        setGoals(goals.filter(g => g.id !== id));
    };

    const updateProgress = async (id, newProgress) => {
        const status = newProgress >= 100 ? 'completed' : 'active';
        await supabase.from('goals').update({ progress: newProgress, status }).eq('id', id);
        setGoals(goals.map(g => g.id === id ? { ...g, progress: newProgress, status } : g));
    };

    const toggleMilestone = async (goal, idx) => {
        const updated = [...(goal.milestones || [])];
        updated[idx] = { ...updated[idx], done: !updated[idx].done };
        const doneCount = updated.filter(m => m.done).length;
        const progress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : goal.progress;
        await supabase.from('goals').update({ milestones: updated, progress }).eq('id', goal.id);
        setGoals(goals.map(g => g.id === goal.id ? { ...g, milestones: updated, progress } : g));
    };

    const generateAISteps = async (goal) => {
        setAiLoading(goal.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Goal: "${goal.title}". Description: "${goal.description || 'none'}". Generate 4 actionable milestones as a numbered list. Each milestone 1 sentence. No markdown.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const steps = text.split('\n').filter(l => l.trim()).map(l => ({ text: l.replace(/^\d+\.\s*/, '').trim(), done: false }));
            await supabase.from('goals').update({ milestones: steps }).eq('id', goal.id);
            setGoals(goals.map(g => g.id === goal.id ? { ...g, milestones: steps } : g));
        } catch (e) { console.error(e); }
        setAiLoading(null);
    };

    const predictSuccess = async (goal) => {
        setPredictingId(goal.id);
        try {
            const daysLeft = getDaysLeft(goal.target_date);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Goal: "${goal.title}". Progress: ${goal.progress}%. Days left until deadline: ${daysLeft !== null ? daysLeft : 'Unknown (no deadline set)'}. Milestones: ${goal.milestones?.length || 0}. 
            Analyze the probability of hitting this goal on time based on current progress vs days left. 
            Return ONLY a valid JSON:
            {
              "probability": 75,
              "analysis": "1 short sentence explaining why.",
              "rescue_plan": "Specific 2-step tactical advice to accelerate progress right now."
            }`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const ai_analysis = JSON.parse(text);
            await supabase.from('goals').update({ ai_analysis }).eq('id', goal.id);
            setGoals(goals.map(g => g.id === goal.id ? { ...g, ai_analysis } : g));
        } catch (e) { console.error(e); }
        setPredictingId(null);
    };

    const ACCENT = '#ef4444';

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.25 }}>
                <ParticleCanvas count={30} speed={0.3} color={ACCENT} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiTarget size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #fca5a5, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Goal Planning
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Advanced Tier • Smart execution & probability forecasting</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #dc2626)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Define Goal'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }} className="glass-card"
                                style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}>
                                    <FiActivity /> New Strategic Objective
                                </h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Goal Title *</label>
                                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Launch Startup MVP" />
                                        </div>
                                        <div className="form-group">
                                            <label>Priority</label>
                                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description / Intent</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Why is this important? What does success look like?" rows={2} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Target Deadline</label>
                                            <input type="date" value={formData.target_date} onChange={e => setFormData({ ...formData, target_date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Dependency (Blocks this Goal)</label>
                                            <select value={formData.dependent_on_id} onChange={e => setFormData({ ...formData, dependent_on_id: e.target.value })}>
                                                <option value="">None (Can start now)</option>
                                                {goals.filter(g => g.status === 'active').map(g => (
                                                    <option key={g.id} value={g.id}>{g.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Color Tag</label>
                                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                {['#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'].map(color => (
                                                    <div key={color} onClick={() => setFormData({ ...formData, color })}
                                                        style={{ width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', border: formData.color === color ? '2.5px solid white' : '2px solid transparent', boxShadow: formData.color === color ? `0 0 12px ${color}` : 'none', opacity: formData.color === color ? 1 : 0.4, transition: 'all 0.2s' }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Milestones (one per line — optional)</label>
                                        <textarea value={formData.milestones} onChange={e => setFormData({ ...formData, milestones: e.target.value })} placeholder="Research market&#10;Build landing page&#10;Get first 10 users" rows={3} />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: formData.color, border: 'none', boxShadow: `0 4px 20px ${formData.color}40` }}>
                                        Establish Goal
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats Row */}
                    {goals.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, color: '#ef4444' },
                                { label: 'Completed', value: goals.filter(g => g.status === 'completed').length, color: '#10b981' },
                                { label: 'Avg Progress', value: `${Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / (goals.length || 1))}%`, color: '#f59e0b' },
                            ].map((s, i) => (
                                <div key={i} className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiZap className="spin" /> Synchronizing objectives...</div>
                    ) : goals.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiTarget size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>No Active Goals</h3>
                            <p style={{ color: 'var(--text-2)', maxWidth: 380, margin: '0 auto 24px' }}>Define your high-level life and career objectives. AI will forecast probability of success and generate actions.</p>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Define First Goal</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {goals.map(goal => {
                                const milestones = goal.milestones || [];
                                const isExpanded = expandedId === goal.id;
                                const pColor = PRIORITY_COLORS[goal.priority] || goal.color;
                                const dependency = goal.dependent_on_id ? goals.find(g => g.id === goal.dependent_on_id) : null;
                                const isBlocked = dependency && dependency.status !== 'completed';

                                return (
                                    <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-card" style={{ borderLeft: `5px solid ${goal.color}`, padding: 0, opacity: isBlocked ? 0.6 : 1 }}>
                                        <div style={{ padding: '24px 28px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                                                {/* Left: Info */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                                                        <h3 style={{ margin: 0, color: 'white', fontSize: 20, fontWeight: 800 }}>{goal.title}</h3>
                                                        <span style={{ fontSize: 10, fontWeight: 800, color: pColor, background: `${pColor}18`, border: `1px solid ${pColor}40`, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' }}>{goal.priority}</span>
                                                        {goal.status === 'completed' && <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: '#10b98118', border: '1px solid #10b98140', padding: '2px 8px', borderRadius: 100 }}>✓ Completed</span>}
                                                        <DeadlineBadge dateStr={goal.target_date} />
                                                    </div>

                                                    {isBlocked && (
                                                        <div style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: '#f59e0b15', padding: '4px 10px', borderRadius: 6, width: 'fit-content' }}>
                                                            <FiLink size={12} /> Blocked until: <strong style={{ color: 'white' }}>{dependency.title}</strong> is completed.
                                                        </div>
                                                    )}

                                                    {goal.description && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16, maxWidth: 640 }}>{goal.description}</p>}

                                                    {/* AI Prediction Box */}
                                                    {goal.ai_analysis && (
                                                        <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                <FiActivity color="#00e5ff" />
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Probability: {goal.ai_analysis.probability}%</span>
                                                            </div>
                                                            <div style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 8 }}>{goal.ai_analysis.analysis}</div>
                                                            {goal.ai_analysis.probability < 50 && (
                                                                <div style={{ fontSize: 12, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '8px 12px', borderRadius: 6, borderLeft: '2px solid #fbbf24' }}>
                                                                    <strong style={{ display: 'block', marginBottom: 4 }}>🆘 AI Rescue Plan:</strong>
                                                                    {goal.ai_analysis.rescue_plan}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Progress Slider Overlay */}
                                                    <div style={{ marginTop: 12 }}>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {[0, 20, 40, 60, 80, 100].map(val => (
                                                                <button key={val} onClick={() => updateProgress(goal.id, val)} disabled={isBlocked}
                                                                    style={{
                                                                        flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700,
                                                                        background: goal.progress >= val && goal.progress > 0 ? `${goal.color}25` : 'rgba(255,255,255,0.04)',
                                                                        border: `1px solid ${goal.progress >= val && goal.progress > 0 ? goal.color : 'rgba(255,255,255,0.08)'}`,
                                                                        color: goal.progress >= val && goal.progress > 0 ? 'white' : 'var(--text-3)',
                                                                        borderRadius: 6, cursor: isBlocked ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                                                                    }}>{val}%</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Rings & Actions */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                                                    <ProgressRing progress={goal.progress} color={goal.color} />

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => predictSuccess(goal)} disabled={predictingId === goal.id || isBlocked}
                                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', fontSize: 11, fontWeight: 700, cursor: isBlocked ? 'not-allowed' : 'pointer', width: '100%' }}>
                                                            {predictingId === goal.id ? <FiZap className="spin" /> : <FiAlertCircle />} {predictingId === goal.id ? 'Analyzing...' : 'Predict'}
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => generateAISteps(goal)} disabled={aiLoading === goal.id || isBlocked}
                                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: isBlocked ? 'not-allowed' : 'pointer', width: '100%' }}>
                                                            {aiLoading === goal.id ? <FiZap className="spin" /> : <FiZap />} Steps
                                                        </motion.button>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDelete(goal.id)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 6 }} className="hover-text-red">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Milestones Toggle */}
                                            {milestones.length > 0 && (
                                                <div style={{ marginTop: 20 }}>
                                                    <button onClick={() => setExpandedId(isExpanded ? null : goal.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '6px 12px' }}>
                                                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                                        {milestones.length} Milestones ({milestones.filter(m => m.done).length} done)
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Milestones expanded */}
                                        <AnimatePresence>
                                            {isExpanded && milestones.length > 0 && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 28px', background: 'rgba(0,0,0,0.2)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {milestones.map((m, idx) => (
                                                            <div key={idx} onClick={() => !isBlocked && toggleMilestone(goal, idx)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: isBlocked ? 'not-allowed' : 'pointer', padding: '10px 14px', borderRadius: 10, background: m.done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s' }}>
                                                                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${m.done ? '#10b981' : 'rgba(255,255,255,0.2)'}`, background: m.done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {m.done && <FiCheckCircle size={10} color="white" />}
                                                                </div>
                                                                <span style={{ fontSize: 13, color: m.done ? 'var(--text-3)' : 'var(--text-1)', textDecoration: m.done ? 'line-through' : 'none' }}>{m.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
