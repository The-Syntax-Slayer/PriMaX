import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCompass, FiPlus, FiTrash2, FiZap, FiTarget, FiAlertTriangle, FiTrendingUp, FiCrosshair, FiStar, FiMinus, FiShieldOff, FiMessageSquare, FiTrendingDown, FiCpu } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const ACCENT = '#0ea5e9';

const PERSONAS = [
    { name: 'Elon Musk', role: 'First Principles & Scaling', color: '#10b981' },
    { name: 'Marcus Aurelius', role: 'Stoic Virtue & Resilience', color: '#f59e0b' },
    { name: 'Warren Buffett', role: 'Value & Long-term Compound', color: '#3b82f6' }
];

function initials(name) {
    if (!name) return '??';
    const split = name.trim().split(' ');
    if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
}

export default function StrategyEngine() {
    const { user } = useAuth();
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Feature loading states
    const [advocateLoading, setAdvocateLoading] = useState(null);
    const [advisorLoading, setAdvisorLoading] = useState({ id: null, persona: null });

    const [formData, setFormData] = useState({ title: '', context: '', color: ACCENT });
    const [options, setOptions] = useState([
        { label: 'Option A', pros: '', cons: '', score: 5 },
        { label: 'Option B', pros: '', cons: '', score: 5 }
    ]);

    const fetchDecisions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('decisions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        if (error) { console.error(error); setDecisions([]); }
        else setDecisions(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchDecisions(); }, [user, fetchDecisions]);
    useRealtimeRefresh('decisions', user?.id, fetchDecisions);

    const updateOption = (idx, field, value) => setOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
    const addOption = () => {
        const labels = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'];
        setOptions(prev => [...prev, { label: labels[prev.length] || `Option ${prev.length + 1}`, pros: '', cons: '', score: 5 }]);
    };
    const removeOption = (idx) => { if (options.length > 2) setOptions(prev => prev.filter((_, i) => i !== idx)); };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;
        setAnalyzing(true);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const optionsText = options.map(o => `${o.label}: Pros="${o.pros}", Cons="${o.cons}", User Score=${o.score}/10`).join('\n');
            const prompt = `You are a strategic decision advisor. Analyze this decision:
Decision: "${formData.title}"
Context: "${formData.context || 'not provided'}"
Options:
${optionsText}

Return ONLY a valid JSON:
{
  "swot": { "strengths": ["s1","s2"], "weaknesses": ["w1","w2"], "opportunities": ["o1","o2"], "threats": ["t1","t2"] },
  "optionScores": [{"label":"Option A","aiScore":7,"reasoning":"1 sentence"}],
  "recommendedOption": "Option A",
  "optimalPath": "A clear concise paragraph on the best course of action.",
  "risks": ["risk1","risk2"],
  "secondOrderEffects": [
    { "timeframe": "Immediate", "effect": "..." },
    { "timeframe": "1 Year", "effect": "..." },
    { "timeframe": "5 Years", "effect": "..." }
  ]
}`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const aiAnalysis = JSON.parse(text);

            const { data, error } = await supabase.from('decisions').insert({
                user_id: user.id, title: formData.title, context: formData.context,
                ai_analysis: { ...aiAnalysis, options }, color: formData.color, status: 'pending'
            }).select().single();

            if (!error && data) {
                setDecisions([data, ...decisions]);
                setShowForm(false);
                setFormData({ title: '', context: '', color: ACCENT });
                setOptions([{ label: 'Option A', pros: '', cons: '', score: 5 }, { label: 'Option B', pros: '', cons: '', score: 5 }]);
            }
        } catch (err) { console.error(err); alert("AI Analysis failed. Try simplifying your inputs."); }
        setAnalyzing(false);
    };

    const handleDelete = async (id) => {
        await supabase.from('decisions').delete().eq('id', id);
        setDecisions(decisions.filter(d => d.id !== id));
    };

    const runDevilsAdvocate = async (decision) => {
        setAdvocateLoading(decision.id);
        try {
            const ai = decision.ai_analysis;
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Decision: ${decision.title}. The AI recommended: "${ai.recommendedOption}". 
            You are a ruthless Devil's Advocate. Your job is to completely destroy this recommended option. Explain why it is a terrible idea and what the catastrophic blind spots are. 
            Return exactly 3 bullet points with brutal honesty. No markdown formatting other than dashes for bullets.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/\*\*/g, '');

            const updatedAi = { ...ai, devils_advocate: text };
            await supabase.from('decisions').update({ ai_analysis: updatedAi }).eq('id', decision.id);
            setDecisions(decisions.map(d => d.id === decision.id ? { ...d, ai_analysis: updatedAi } : d));
        } catch (e) { console.error(e); }
        setAdvocateLoading(null);
    };

    const runAdvisor = async (decision, persona) => {
        setAdvisorLoading({ id: decision.id, persona: persona.name });
        try {
            const ai = decision.ai_analysis;
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Decision: ${decision.title}. Context: ${decision.context}. Options: ${ai.options.map(o => o.label).join(', ')}.
            You are ${persona.name}. Evaluate this decision from your exact worldview and ideology (${persona.role}). 
            Speak in first person as ${persona.name}. Be extremely concise, brutal, and insightful. Return exactly 1 paragraph. No markdown.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/\*\*/g, '');

            const advisors = ai.advisors || {};
            advisors[persona.name] = text;

            const updatedAi = { ...ai, advisors };
            await supabase.from('decisions').update({ ai_analysis: updatedAi }).eq('id', decision.id);
            setDecisions(decisions.map(d => d.id === decision.id ? { ...d, ai_analysis: updatedAi } : d));
        } catch (e) { console.error(e); }
        setAdvisorLoading({ id: null, persona: null });
    };

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.25 }}>
                <ParticleCanvas count={30} speed={0.4} color={ACCENT} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiCompass size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #7dd3fc, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Strategy Engine
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • Devil's Advocate, 2nd-Order Effects & Persona Simulation</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #0284c7)`, border: 'none' }} disabled={analyzing}>
                        {analyzing ? <FiZap className="spin" /> : <FiPlus />}
                        {analyzing ? 'Analyzing Matrix...' : showForm ? 'Cancel' : 'New Decision'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }}
                                className="glass-card" style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}><FiCrosshair /> Define Your Decision Axis</h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="form-group">
                                        <label>Decision Title *</label>
                                        <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Bootstrapping vs VC Funding" disabled={analyzing} />
                                    </div>
                                    <div className="form-group">
                                        <label>Context / Stakes</label>
                                        <textarea value={formData.context} onChange={e => setFormData({ ...formData, context: e.target.value })} placeholder="Provide stakes, timelines, emotional context..." rows={2} disabled={analyzing} />
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <label style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nodes (Options)</label>
                                            <button type="button" onClick={addOption} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                <FiPlus size={12} /> Add Node
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {options.map((opt, idx) => (
                                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                                            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${ACCENT}20`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{idx + 1}</div>
                                                            <input value={opt.label} onChange={e => updateOption(idx, 'label', e.target.value)} className="app-input" style={{ flex: 1, padding: '8px 12px' }} />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20 }}>
                                                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>Gut Score:</span>
                                                            <select value={opt.score} onChange={e => updateOption(idx, 'score', parseInt(e.target.value))} className="app-input" style={{ padding: '6px 10px', width: 80 }}>
                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}/10</option>)}
                                                            </select>
                                                            {options.length > 2 && <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><FiTrash2 size={16} /></button>}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div className="form-group"><label style={{ color: '#10b981' }}>✓ Strengths (optional)</label><textarea value={opt.pros} onChange={e => updateOption(idx, 'pros', e.target.value)} rows={2} style={{ fontSize: 13 }} /></div>
                                                        <div className="form-group"><label style={{ color: '#ef4444' }}>✗ Weaknesses (optional)</label><textarea value={opt.cons} onChange={e => updateOption(idx, 'cons', e.target.value)} rows={2} style={{ fontSize: 13 }} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'center', padding: '12px 32px', fontSize: 14, marginTop: 10, background: ACCENT, border: 'none' }} disabled={analyzing}>
                                        {analyzing ? <><FiZap className="spin" /> Computing Multi-D Matrix...</> : <><FiCpu /> Run Strategic Simulation</>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiZap className="spin" /> Booting simulators...</div>
                    ) : decisions.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiCompass size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>No Simulations Running</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Initialize Engine</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {decisions.map(decision => {
                                const ai = decision.ai_analysis;
                                const opts = ai?.options || [];
                                const scores = ai?.optionScores || [];
                                const recommended = ai?.recommendedOption;

                                // Parse effects to array if they aren't already objects
                                let effects = ai?.secondOrderEffects || [];
                                if (effects.length > 0 && typeof effects[0] === 'string') {
                                    effects = [
                                        { timeframe: 'Immediate', effect: effects[0] },
                                        { timeframe: '1 Year', effect: effects[1] || 'TBD' },
                                        { timeframe: '5 Years', effect: effects[2] || 'TBD' }
                                    ];
                                }

                                return (
                                    <motion.div key={decision.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-card" style={{ padding: 0, borderTop: `4px solid ${decision.color || ACCENT}`, overflow: 'hidden' }}>

                                        <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h2 style={{ margin: '0 0 8px', color: 'white', fontSize: 22, fontWeight: 800 }}>{decision.title}</h2>
                                                    {decision.context && <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>{decision.context}</p>}
                                                </div>
                                                <button onClick={() => handleDelete(decision.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 8 }} className="hover-text-red"><FiTrash2 size={16} /></button>
                                            </div>
                                        </div>

                                        {ai && (
                                            <div style={{ padding: 24 }}>

                                                {/* 1. Recommendation vs Devil's Advocate */}
                                                <div style={{ display: 'grid', gridTemplateColumns: ai.devils_advocate ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
                                                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', padding: 20, borderRadius: 12 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                            <FiStar size={16} color="#10b981" />
                                                            <h4 style={{ color: '#10b981', margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimal Path: {recommended}</h4>
                                                        </div>
                                                        <p style={{ margin: 0, color: 'white', fontSize: 14, lineHeight: 1.6 }}>{ai.optimalPath || ai.recommendationReason}</p>

                                                        {!ai.devils_advocate && (
                                                            <button onClick={() => runDevilsAdvocate(decision)} disabled={advocateLoading === decision.id} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 0 0', padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                                {advocateLoading === decision.id ? <FiZap className="spin" /> : <FiShieldOff />} Inject Devil's Advocate
                                                            </button>
                                                        )}
                                                    </div>

                                                    {ai.devils_advocate && (
                                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', padding: 20, borderRadius: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                                <FiTrendingDown size={16} color="#ef4444" />
                                                                <h4 style={{ color: '#ef4444', margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Assault (Devil's Advocate)</h4>
                                                            </div>
                                                            <div style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ai.devils_advocate}</div>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* 2. Second-Order Effects Chain */}
                                                {effects.length >= 3 && (
                                                    <div style={{ marginBottom: 32 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>N-Order Effects Trajectory</div>
                                                        <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
                                                            {effects.map((eff, i) => (
                                                                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, position: 'relative', zIndex: 1 }}>
                                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}`, marginBottom: 12, marginLeft: 'auto', marginRight: 'auto' }} />
                                                                    <div style={{ textAlign: 'center', color: ACCENT, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>{eff.timeframe}</div>
                                                                    <div style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5, textAlign: 'center' }}>{eff.effect}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. Original Options & Scores (Condensed) */}
                                                <div style={{ marginBottom: 32 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Option Matrix</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(opts.length, 3)}, 1fr)`, gap: 12 }}>
                                                        {opts.map((opt, idx) => {
                                                            const scoreData = scores.find(s => s.label === opt.label);
                                                            return (
                                                                <div key={idx} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <div style={{ fontWeight: 800, color: 'white', fontSize: 14, marginBottom: 8 }}>{opt.label}</div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                                                                        <span>User: <b style={{ color: 'white' }}>{opt.score}/10</b></span>
                                                                        {scoreData && <span>AI: <b style={{ color: ACCENT }}>{scoreData.aiScore}/10</b></span>}
                                                                    </div>
                                                                    {scoreData?.reasoning && <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{scoreData.reasoning}</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* 4. Board of Advisors Simulation */}
                                                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)', padding: 24 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><FiUsers size={16} color={ACCENT} /> Board of Advisors Simulation</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Inject external worldviews</div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                                        {PERSONAS.map((p, idx) => {
                                                            const advText = ai.advisors?.[p.name];
                                                            const isLoading = advisorLoading.id === decision.id && advisorLoading.persona === p.name;
                                                            return (
                                                                <div key={idx} style={{ background: `${p.color}05`, border: `1px solid ${p.color}30`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, fontWeight: 800, border: `1px solid ${p.color}50` }}>{initials(p.name)}</div>
                                                                        <div>
                                                                            <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{p.name}</div>
                                                                            <div style={{ fontSize: 10, color: p.color }}>{p.role}</div>
                                                                        </div>
                                                                    </div>

                                                                    {advText ? (
                                                                        <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6, fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, borderLeft: `2px solid ${p.color}` }}>"{advText}"</div>
                                                                    ) : (
                                                                        <button onClick={() => runAdvisor(decision, p)} disabled={isLoading} style={{ marginTop: 'auto', padding: '8px 0', width: '100%', background: `${p.color}15`, border: `1px solid ${p.color}40`, color: p.color, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                                                                            {isLoading ? <FiZap className="spin" /> : <FiMessageSquare />} Generate Perspective
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                            </div>
                                        )}
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

// Fix FiUsers import missing
import { FiUsers } from 'react-icons/fi';
