import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookOpen, FiPlus, FiTrash2, FiVideo, FiMonitor, FiCpu, FiExternalLink, FiZap, FiCalendar, FiTarget, FiMessageSquare, FiX, FiCheckCircle } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const ACCENT = '#3b82f6';

const CATEGORIES = ['Course', 'Book', 'Skill', 'Tutorial', 'Podcast'];
const CATEGORY_ICONS = {
    Course: <FiMonitor size={18} />,
    Book: <FiBookOpen size={18} />,
    Skill: <FiCpu size={18} />,
    Tutorial: <FiVideo size={18} />,
    Podcast: <FiVideo size={18} />,
};

function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

// ------------------------------------------------------------------
// COMPONENT: SKILL TREE VISUALIZATION
// ------------------------------------------------------------------
const SkillTree = ({ items, onUpdateProgress, onGeneratePlan, onOpenQuiz, onOpenFeynman, aiLoading }) => {
    // Group items by category to form "swimlanes"
    const lanes = useMemo(() => {
        const grouped = {};
        CATEGORIES.forEach(c => grouped[c] = []);
        items.forEach(i => { if (grouped[i.category]) grouped[i.category].push(i); });
        // sort each lane by created_at (simulate progression path)
        Object.keys(grouped).forEach(k => {
            grouped[k] = grouped[k].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
        return grouped;
    }, [items]);

    return (
        <div style={{ padding: 20, overflowX: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ minWidth: 800, display: 'flex', flexDirection: 'column', gap: 40 }}>
                {CATEGORIES.map(category => {
                    const laneItems = lanes[category];
                    if (laneItems.length === 0) return null;
                    return (
                        <div key={category} style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, opacity: 0.6 }}>
                                {CATEGORY_ICONS[category]}
                                <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{category} PATH</h4>
                            </div>

                            <div style={{ display: 'flex', position: 'relative', paddingLeft: 20 }}>
                                {/* Horizontal connection line */}
                                <div style={{ position: 'absolute', top: '50%', left: 40, right: 40, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

                                <div style={{ display: 'flex', gap: 60, zIndex: 1, position: 'relative' }}>
                                    {laneItems.map((item, idx) => {
                                        const isFinished = item.progress >= 100;
                                        const isActive = item.progress > 0 && !isFinished;
                                        const borderColor = isFinished ? '#10b981' : isActive ? item.color : 'rgba(255,255,255,0.1)';

                                        return (
                                            <div key={item.id} style={{ position: 'relative' }}>
                                                {/* Connecting line to previous item if completed */}
                                                {idx > 0 && laneItems[idx - 1].progress >= 100 && (
                                                    <div style={{ position: 'absolute', top: '50%', left: -60, width: 60, height: 2, background: '#10b981', boxShadow: '0 0 8px #10b981', zIndex: -1 }} />
                                                )}

                                                <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card"
                                                    style={{ width: 260, padding: 16, border: `2px solid ${borderColor}`, opacity: idx > 0 && laneItems[idx - 1].progress < 100 ? 0.5 : 1, background: 'var(--app-surface)', boxShadow: isActive ? `0 0 20px ${item.color}30` : isFinished ? '0 0 20px rgba(16,185,129,0.2)' : 'none' }}>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'white' }}>{item.title}</h3>
                                                        {isFinished && <FiCheckCircle color="#10b981" />}
                                                    </div>

                                                    {/* Progress */}
                                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${item.progress}%`, background: isFinished ? '#10b981' : item.color, boxShadow: `0 0 8px ${item.color}` }} />
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                        <button onClick={() => onGeneratePlan(item)} disabled={aiLoading === item.id} style={{ padding: '6px', fontSize: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 4 }}>
                                                            <FiZap size={12} /> Plan
                                                        </button>
                                                        <button onClick={() => onOpenQuiz(item)} style={{ padding: '6px', fontSize: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 4 }}>
                                                            <FiTarget size={12} /> SRS Quiz
                                                        </button>
                                                        <button onClick={() => onOpenFeynman(item)} style={{ gridColumn: 'span 2', padding: '6px', fontSize: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 4 }}>
                                                            <FiMessageSquare size={12} /> Feynman Technique
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function Learning() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'tree'

    // AI States
    const [aiLoading, setAiLoading] = useState(null);
    const [aiPlans, setAiPlans] = useState({});

    // SRS Quiz State
    const [quizItem, setQuizItem] = useState(null);
    const [quizCards, setQuizCards] = useState([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizRevealed, setQuizRevealed] = useState(false);

    // Feynman State
    const [feynmanItem, setFeynmanItem] = useState(null);
    const [feynmanInput, setFeynmanInput] = useState('');
    const [feynmanResult, setFeynmanResult] = useState(null);

    const [formData, setFormData] = useState({
        title: '', category: 'Course', url: '', target_date: '', frequency: 'Daily', notes: '', color: ACCENT
    });

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('learning_items').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        if (error) { console.error(error); setItems([]); }
        else setItems(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchItems(); }, [user, fetchItems]);
    useRealtimeRefresh('learning_items', user?.id, fetchItems);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;
        const { data, error } = await supabase.from('learning_items').insert({
            user_id: user.id, title: formData.title, category: formData.category, url: formData.url || null,
            target_date: formData.target_date || null, frequency: formData.frequency, notes: formData.notes || null,
            color: formData.color, progress: 0, status: 'In Progress'
        }).select().single();
        if (!error && data) {
            setItems([data, ...items]);
            setShowForm(false);
            setFormData({ title: '', category: 'Course', url: '', target_date: '', frequency: 'Daily', notes: '', color: ACCENT });
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('learning_items').delete().eq('id', id);
        setItems(items.filter(i => i.id !== id));
    };

    const updateProgress = async (id, val) => {
        const status = val >= 100 ? 'Completed' : 'In Progress';
        await supabase.from('learning_items').update({ progress: val, status }).eq('id', id);
        setItems(items.map(i => i.id === id ? { ...i, progress: val, status } : i));
    };

    const generateStudyPlan = async (item) => {
        setAiLoading(item.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `I'm learning "${item.title}" (${item.category}). Target: ${item.target_date || 'None'}. Give me a 4-step actionable study plan. Steps on new lines. No markdown.`;
            const result = await model.generateContent(prompt);
            setAiPlans(prev => ({ ...prev, [item.id]: result.response.text().trim().replace(/\*\*/g, '') }));
        } catch (e) { console.error(e); }
        setAiLoading(null);
    };

    const generateQuiz = async (item) => {
        setAiLoading(item.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Generate 3 spaced-repetition flashcards to test knowledge on "${item.title}". Context notes: "${item.notes || 'None'}". Return ONLY valid JSON array: [{"q": "Question here", "a": "Answer here"}]. No markdown wrapping.`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            setQuizCards(JSON.parse(text));
            setQuizItem(item);
            setQuizIndex(0);
            setQuizRevealed(false);
        } catch (e) { console.error(e); alert("Failed to generate quiz. Try again."); }
        setAiLoading(null);
    };

    const runFeynman = async () => {
        if (!feynmanInput) return;
        setAiLoading('feynman');
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Topic: "${feynmanItem.title}". Student's explanation: "${feynmanInput}". Grade their understanding from 0 to 100 based on accuracy and simplicity (Feynman technique). Give 2 short sentences of constructive feedback identifying gaps or praising clarity. Return ONLY JSON: {"score": 85, "feedback": "..."}`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();

            const analysis = JSON.parse(text);
            setFeynmanResult(analysis);

            // Optionally save the score to the DB using ai_stats JSONB
            // Not strictly required for UI, but good for persistence
            const currentAiStats = feynmanItem.ai_stats || {};
            await supabase.from('learning_items').update({
                ai_stats: { ...currentAiStats, feynman_history: [...(currentAiStats.feynman_history || []), analysis.score] }
            }).eq('id', feynmanItem.id);

        } catch (e) { console.error(e); }
        setAiLoading(null);
    };

    // Close modals
    const closeQuiz = () => { setQuizItem(null); setQuizCards([]); };
    const closeFeynman = () => { setFeynmanItem(null); setFeynmanResult(null); setFeynmanInput(''); };

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
                                <FiBookOpen size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #93c5fd, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Learning System
                            </h1>
                            <div style={{ marginLeft: 16, display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                                <button onClick={() => setViewMode('grid')} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: viewMode === 'grid' ? ACCENT : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-3)', border: 'none', cursor: 'pointer' }}>Grid</button>
                                <button onClick={() => setViewMode('tree')} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: viewMode === 'tree' ? ACCENT : 'transparent', color: viewMode === 'tree' ? 'white' : 'var(--text-3)', border: 'none', cursor: 'pointer' }}>Skill Tree</button>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • Spaced Repetition, Feynman Bots & Skill Trees</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #2563eb)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Add Resource'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="glass-card" style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}><FiBookOpen /> Add Learning Resource</h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Course / Topic Name *</label>
                                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Advanced React Patterns" />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Study Frequency</label>
                                            <select value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                                                {['Daily', '3x/week', 'Weekly', 'Weekends'].map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Resource URL (optional)</label>
                                            <input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Target Completion Date</label>
                                            <input type="date" value={formData.target_date} onChange={e => setFormData({ ...formData, target_date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Color Tag</label>
                                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                {['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'].map(color => (
                                                    <div key={color} onClick={() => setFormData({ ...formData, color })}
                                                        style={{ width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', border: formData.color === color ? '2px solid white' : '2px solid transparent', opacity: formData.color === color ? 1 : 0.4 }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Notes / Materials</label>
                                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Key topics to cover, preferred resources, chapter notes..." rows={2} />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: ACCENT, border: 'none' }}>Add to Learning Queue</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats */}
                    {items.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'In Progress', value: items.filter(i => i.status === 'In Progress').length, color: ACCENT },
                                { label: 'Completed', value: items.filter(i => i.status === 'Completed').length, color: '#10b981' },
                                { label: 'Avg Progress', value: `${Math.round(items.reduce((s, i) => s + (i.progress || 0), 0) / (items.length || 1))}%`, color: '#f59e0b' },
                            ].map((s, i) => (
                                <div key={i} className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiZap className="spin" /> Connecting...</div>
                    ) : items.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiBookOpen size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>Knowledge Vault Empty</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Add First Resource</button>
                        </div>
                    ) : viewMode === 'tree' ? (
                        <SkillTree items={items} onUpdateProgress={updateProgress} onGeneratePlan={generateStudyPlan} onOpenQuiz={generateQuiz} onOpenFeynman={setFeynmanItem} aiLoading={aiLoading} />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                            {items.map(item => {
                                const daysLeft = getDaysLeft(item.target_date);
                                const urgencyColor = daysLeft === null ? 'var(--text-3)' : daysLeft < 0 ? '#ef4444' : daysLeft < 7 ? '#f59e0b' : '#10b981';
                                return (
                                    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                        className="glass-card hover-glow" style={{ borderTop: `3px solid ${item.color || ACCENT}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color || ACCENT}20`, color: item.color || ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {CATEGORY_ICONS[item.category] || <FiBookOpen size={18} />}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{item.title}</h3>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                        <span style={{ fontSize: 11, color: item.color || ACCENT, fontWeight: 700, textTransform: 'uppercase' }}>{item.category}</span>
                                                        {item.frequency && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>• {item.frequency}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-3)', padding: 4, display: 'flex' }}><FiExternalLink size={14} /></a>}
                                                <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} className="hover-text-red"><FiTrash2 size={14} /></button>
                                            </div>
                                        </div>

                                        {item.target_date && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: urgencyColor, fontWeight: 700, marginBottom: 16, background: `${urgencyColor}10`, border: `1px solid ${urgencyColor}30`, padding: '4px 10px', borderRadius: 8, width: 'fit-content' }}>
                                                <FiCalendar size={10} />
                                                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                                            </div>
                                        )}

                                        {/* Action Area */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                                            <button onClick={() => generateStudyPlan(item)} disabled={aiLoading === item.id} className="btn-primary" style={{ padding: '8px 4px', fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                                                {aiLoading === item.id ? <FiZap className="spin" /> : <FiZap />} Plan
                                            </button>
                                            <button onClick={() => generateQuiz(item)} disabled={aiLoading === item.id} className="btn-primary" style={{ padding: '8px 4px', fontSize: 11, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                                                <FiTarget /> SRS Quiz
                                            </button>
                                            <button onClick={() => setFeynmanItem(item)} className="btn-primary" style={{ padding: '8px 4px', fontSize: 11, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                                                <FiMessageSquare /> Feynman
                                            </button>
                                        </div>

                                        {aiPlans[item.id] && (
                                            <div style={{ marginBottom: 16, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 12 }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FiZap /> Study Plan</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aiPlans[item.id]}</div>
                                            </div>
                                        )}

                                        {/* Progress */}
                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--text-2)' }}>
                                                <span>PROGRESS</span>
                                                <span style={{ color: item.progress >= 100 ? '#10b981' : item.color || ACCENT }}>{item.progress}%</span>
                                            </div>
                                            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} style={{ height: '100%', background: item.progress >= 100 ? '#10b981' : item.color || ACCENT, borderRadius: 3 }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {[0, 25, 50, 75, 100].map(val => (
                                                    <button key={val} onClick={() => updateProgress(item.id, val)} style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 800, background: item.progress >= val ? `${item.color || ACCENT}20` : 'transparent', border: `1px solid ${item.progress >= val ? item.color || ACCENT : 'rgba(255,255,255,0.06)'}`, color: item.progress >= val ? 'white' : 'var(--text-3)', borderRadius: 6, cursor: 'pointer' }}>{val}%</button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* SRS QUİZ MODAL */}
            <AnimatePresence>
                {quizItem && quizCards.length > 0 && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 32, background: 'var(--app-surface)', border: '1px solid #c084fc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#c084fc' }}>
                                    <FiTarget size={24} />
                                    <h2 style={{ margin: 0, fontSize: 20 }}>SRS Flashcard</h2>
                                </div>
                                <button onClick={closeQuiz} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FiX size={24} /></button>
                            </div>

                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Card {quizIndex + 1} of {quizCards.length}</div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 12, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: 24 }}>
                                <h3 style={{ margin: 0, fontSize: 18, color: 'white', lineHeight: 1.5 }}>
                                    {quizRevealed ? quizCards[quizIndex].a : quizCards[quizIndex].q}
                                </h3>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                {!quizRevealed ? (
                                    <button onClick={() => setQuizRevealed(true)} className="btn-primary" style={{ width: '100%', background: '#c084fc', border: 'none' }}>Reveal Answer</button>
                                ) : (
                                    <>
                                        {/* Simplified SRS feedback mock */}
                                        <button onClick={() => { setQuizRevealed(false); if (quizIndex < quizCards.length - 1) setQuizIndex(quizIndex + 1); else closeQuiz(); }} className="btn-primary" style={{ flex: 1, background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444' }}>Hard</button>
                                        <button onClick={() => { setQuizRevealed(false); if (quizIndex < quizCards.length - 1) setQuizIndex(quizIndex + 1); else closeQuiz(); }} className="btn-primary" style={{ flex: 1, background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid #10b981' }}>Easy</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FEYNMAN BOT MODAL */}
            <AnimatePresence>
                {feynmanItem && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card" style={{ width: '100%', maxWidth: 600, padding: 32, background: 'var(--app-surface)', border: '1px solid #34d399' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399' }}>
                                    <FiMessageSquare size={24} />
                                    <h2 style={{ margin: 0, fontSize: 20 }}>Feynman Sandbox</h2>
                                </div>
                                <button onClick={closeFeynman} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FiX size={24} /></button>
                            </div>

                            <p style={{ color: 'var(--text-2)', marginBottom: 20, fontSize: 14 }}>
                                Explain <strong>{feynmanItem.title}</strong> in simple terms, as if to a beginner. AI will grade your conceptual grasp.
                            </p>

                            {!feynmanResult ? (
                                <>
                                    <textarea className="app-input" value={feynmanInput} onChange={e => setFeynmanInput(e.target.value)} rows={5} placeholder="Start explaining here..." style={{ width: '100%', marginBottom: 16 }}></textarea>
                                    <button onClick={runFeynman} disabled={aiLoading === 'feynman' || !feynmanInput} className="btn-primary" style={{ width: '100%', background: '#34d399', color: '#064e3b', border: 'none' }}>
                                        {aiLoading === 'feynman' ? <FiZap className="spin" /> : 'Evaluate Mastery'}
                                    </button>
                                </>
                            ) : (
                                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, fontWeight: 900, color: feynmanResult.score > 80 ? '#10b981' : '#f59e0b', fontFamily: 'Orbitron, monospace', marginBottom: 16 }}>
                                        {feynmanResult.score}/100
                                    </div>
                                    <p style={{ fontSize: 15, color: 'var(--text-1)', lineHeight: 1.6, margin: 0 }}>
                                        {feynmanResult.feedback}
                                    </p>
                                    <button onClick={closeFeynman} className="btn-primary" style={{ marginTop: 24, width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none' }}>Close</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
