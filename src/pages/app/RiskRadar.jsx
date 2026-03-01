import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiPlus, FiTrash2, FiShield, FiZap, FiCheck, FiClock, FiAlertCircle, FiActivity, FiArrowRight, FiTarget, FiCrosshair } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const ACCENT = '#ef4444';

const IMPACT_LEVELS = ['Critical', 'High', 'Medium', 'Low'];
const LIKELIHOOD_LEVELS = ['Very Likely', 'Likely', 'Possible', 'Unlikely'];
const CATEGORIES = ['Financial', 'Career', 'Health', 'Relationship', 'Legal', 'Technical', 'Reputational', 'Other'];

function getPriorityScore(impact, likelihood) {
    const impactVal = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const likelyhoodVal = { 'Very Likely': 4, 'Likely': 3, 'Possible': 2, 'Unlikely': 1 };
    return (impactVal[impact] || 2) * (likelyhoodVal[likelihood] || 2);
}

function getPriorityLabel(score) {
    if (score >= 12) return { label: 'CRITICAL', color: '#ef4444' };
    if (score >= 8) return { label: 'HIGH', color: '#f59e0b' };
    if (score >= 4) return { label: 'MEDIUM', color: '#3b82f6' };
    return { label: 'LOW', color: '#10b981' };
}

function getDaysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function RiskRadar() {
    const { user } = useAuth();
    const [risks, setRisks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // AI States
    const [aiLoading, setAiLoading] = useState(null);
    const [aiSteps, setAiSteps] = useState({});
    const [premortemLoading, setPremortemLoading] = useState(null);
    const [premortems, setPremortems] = useState({});

    // Task Export Status
    const [taskExportStatus, setTaskExportStatus] = useState({});

    const [formData, setFormData] = useState({
        title: '', category: 'Financial', impact: 'High', likelihood: 'Possible',
        mitigation_plan: '', deadline: '', color: ACCENT
    });

    const fetchRisks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('risk_radar').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        if (error) { console.error(error); setRisks([]); }
        else setRisks((data || []).sort((a, b) => getPriorityScore(b.impact, b.likelihood) - getPriorityScore(a.impact, a.likelihood)));
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchRisks(); }, [user, fetchRisks]);
    useRealtimeRefresh('risk_radar', user?.id, fetchRisks);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;
        const { data, error } = await supabase.from('risk_radar').insert({
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            impact: formData.impact,
            likelihood: formData.likelihood,
            mitigation_plan: formData.mitigation_plan || null,
            deadline: formData.deadline || null,
            color: formData.color,
            status: 'Active'
        }).select().single();
        if (!error && data) {
            setRisks(prev => [data, ...prev].sort((a, b) => getPriorityScore(b.impact, b.likelihood) - getPriorityScore(a.impact, a.likelihood)));
            setShowForm(false);
            setFormData({ title: '', category: 'Financial', impact: 'High', likelihood: 'Possible', mitigation_plan: '', deadline: '', color: ACCENT });
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('risk_radar').delete().eq('id', id);
        setRisks(risks.filter(r => r.id !== id));
        setAiSteps(prev => { const n = { ...prev }; delete n[id]; return n; });
        setPremortems(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    const toggleStatus = async (id, current) => {
        const next = current === 'Active' ? 'Mitigated' : 'Active';
        await supabase.from('risk_radar').update({ status: next }).eq('id', id);
        setRisks(risks.map(r => r.id === id ? { ...r, status: next } : r));
    };

    const generateNextSteps = async (risk) => {
        setAiLoading(risk.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Risk: "${risk.title}" | Category: ${risk.category} | Impact: ${risk.impact} | Likelihood: ${risk.likelihood} | Current mitigation: "${risk.mitigation_plan || 'none'}". Give me EXACTLY 3 specific, actionable next steps to mitigate this risk. 
            Return ONLY a valid JSON array of strings: ["Step 1...", "Step 2...", "Step 3..."]`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const stepsArray = JSON.parse(text);

            setAiSteps(prev => ({ ...prev, [risk.id]: stepsArray }));
        } catch (e) { console.error(e); alert("Failed to generate steps."); }
        setAiLoading(null);
    };

    const generatePremortem = async (risk) => {
        setPremortemLoading(risk.id);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Imagine it is 2 years from now. The risk "${risk.title}" (Impact: ${risk.impact}, Likelihood: ${risk.likelihood}) has fully materialized and completely devastated the user's goals.
            Write a harsh, realistic, 1-paragraph "Pre-Mortem" story describing exactly HOW it failed and the painful consequences, to build psychological urgency to fix it NOW. Format as a direct, punchy narrative. No markdown.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/\*\*/g, '');
            setPremortems(prev => ({ ...prev, [risk.id]: text }));
        } catch (e) { console.error(e); }
        setPremortemLoading(null);
    };

    const exportToTasks = async (stepText, riskId, stepIndex) => {
        const taskKey = `${riskId}_${stepIndex}`;
        setTaskExportStatus(prev => ({ ...prev, [taskKey]: 'loading' }));
        try {
            const { error } = await supabase.from('tasks').insert({
                user_id: user.id,
                title: `[Mitigation] ${stepText.length > 50 ? stepText.substring(0, 50) + '...' : stepText}`,
                status: 'Todo',
                priority: 'High'
            });
            if (error) throw error;
            setTaskExportStatus(prev => ({ ...prev, [taskKey]: 'done' }));
            setTimeout(() => setTaskExportStatus(prev => ({ ...prev, [taskKey]: null })), 3000);
        } catch (e) {
            console.error(e);
            setTaskExportStatus(prev => ({ ...prev, [taskKey]: 'error' }));
        }
    };

    const criticalRisks = risks.filter(r => r.status === 'Active' && getPriorityScore(r.impact, r.likelihood) >= 12);
    const activeRisks = risks.filter(r => r.status === 'Active');

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.25 }}>
                <ParticleCanvas count={25} speed={0.5} color={ACCENT} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiShield size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #fca5a5, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Risk Radar
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • AI Pre-Mortems, Contagion Mapping & 1-Click Task Export</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #dc2626)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Flag Risk'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    {/* Critical Alert */}
                    {criticalRisks.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', marginBottom: 20, boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
                            <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                <FiAlertCircle size={24} color={ACCENT} />
                            </motion.div>
                            <div>
                                <span style={{ fontSize: 14, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity 1 Alert: {criticalRisks.length} Critical Threats Detected</span>
                                <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 4 }}>Immediate mitigation required: {criticalRisks.map(r => r.title).join(', ')}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Contagion Overview Graph (Visual only representation) */}
                    {activeRisks.length > 1 && (
                        <div className="glass-card" style={{ marginBottom: 24, padding: '20px', border: `1px solid ${ACCENT}20` }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><FiActivity color={ACCENT} /> Threat Contagion Map</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                                {activeRisks.slice(0, 5).map((r, i) => (
                                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ background: `rgba(239,68,68,${getPriorityScore(r.impact, r.likelihood) / 16})`, border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', borderRadius: 8, fontSize: 11, color: 'white', fontWeight: 600 }}>
                                            {r.title.length > 20 ? r.title.substring(0, 20) + '...' : r.title}
                                        </div>
                                        {i < activeRisks.slice(0, 5).length - 1 && <FiArrowRight color="var(--text-3)" />}
                                    </div>
                                ))}
                                {activeRisks.length > 5 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>+ {activeRisks.length - 5} more</span>}
                            </div>
                            <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--text-3)' }}>* Nodes ordered by cascading priority threat level</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }} className="glass-card"
                                style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}10, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}>
                                    <FiCrosshair /> Target New Threat Vector
                                </h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Threat Description *</label>
                                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. AWS server wipe out" />
                                        </div>
                                        <div className="form-group">
                                            <label>Sector</label>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Blast Radius (Impact)</label>
                                            <select value={formData.impact} onChange={e => setFormData({ ...formData, impact: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>
                                                {IMPACT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Probability (Likelihood)</label>
                                            <select value={formData.likelihood} onChange={e => setFormData({ ...formData, likelihood: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>
                                                {LIKELIHOOD_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Initial Mitigation Protocol</label>
                                            <input type="text" value={formData.mitigation_plan} onChange={e => setFormData({ ...formData, mitigation_plan: e.target.value })} placeholder="Immediate evasive actions..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Critical Review Date</label>
                                            <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: ACCENT, border: 'none', padding: '10px 24px', fontWeight: 800 }}>Inject Threat</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats */}
                    {risks.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                            {[
                                { label: 'Total Tracked', value: risks.length, color: 'var(--text-1)' },
                                { label: 'Active Threats', value: risks.filter(r => r.status === 'Active').length, color: ACCENT },
                                { label: 'Shielded', value: risks.filter(r => r.status === 'Mitigated').length, color: '#10b981' },
                                { label: 'Critical Mass', value: criticalRisks.length, color: criticalRisks.length > 0 ? ACCENT : '#10b981' },
                            ].map((s, i) => (
                                <div key={i} className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', fontWeight: 800 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiActivity className="spin" size={24} /></div>
                    ) : risks.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiShield size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>Radar Clear</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Inject First Threat</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {risks.map(risk => {
                                const score = getPriorityScore(risk.impact, risk.likelihood);
                                const { label: pLabel, color: pColor } = getPriorityLabel(score);
                                const isMitigated = risk.status === 'Mitigated';
                                const days = getDaysLeft(risk.deadline);
                                return (
                                    <motion.div key={risk.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-card" style={{ borderLeft: `4px solid ${pColor}`, opacity: isMitigated ? 0.65 : 1, padding: '24px' }}>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                                                {/* Priority Score */}
                                                <div style={{ width: 60, height: 60, borderRadius: 14, background: `${pColor}10`, border: `2px solid ${pColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isMitigated ? 'none' : `0 0 15px ${pColor}20` }}>
                                                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900, color: pColor, lineHeight: 1 }}>{score}</div>
                                                    <div style={{ fontSize: 9, color: pColor, fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>lvl</div>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                                                        <h3 style={{ margin: 0, color: isMitigated ? 'var(--text-3)' : 'white', fontSize: 18, fontWeight: 800, textDecoration: isMitigated ? 'line-through' : 'none' }}>{risk.title}</h3>
                                                        <span style={{ fontSize: 10, fontWeight: 800, color: pColor, background: `${pColor}15`, border: `1px solid ${pColor}35`, padding: '2px 8px', borderRadius: 100 }}>{pLabel}</span>
                                                        <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'rgba(255,255,255,0.05)', padding: '1px 7px', borderRadius: 100 }}>{risk.category}</span>
                                                        {isMitigated && <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 7px', borderRadius: 100 }}>✓ SHIELDED</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                                                        <span>Radius: <b style={{ color: pColor }}>{risk.impact}</b></span>
                                                        <span>Prob: <b style={{ color: pColor }}>{risk.likelihood}</b></span>
                                                        {days !== null && (
                                                            <span style={{ color: days < 0 ? '#ef4444' : days < 7 ? '#f59e0b' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                                                <FiClock size={12} /> {days < 0 ? `T-${Math.abs(days)}d OVERDUE` : days === 0 ? 'T-00 TODAY' : `T-${days}d`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 10, marginLeft: 12 }}>
                                                {!isMitigated && (
                                                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => generatePremortem(risk)} disabled={premortemLoading === risk.id}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                        {premortemLoading === risk.id ? <FiActivity className="spin" /> : <FiAlertTriangle />} Pre-Mortem
                                                    </motion.button>
                                                )}
                                                <motion.button whileHover={{ scale: 1.05 }} onClick={() => generateNextSteps(risk)} disabled={aiLoading === risk.id}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                    {aiLoading === risk.id ? <FiActivity className="spin" /> : <FiZap />} Plan
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.05 }} onClick={() => toggleStatus(risk.id, risk.status)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: isMitigated ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${isMitigated ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: isMitigated ? ACCENT : '#10b981', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                                    {isMitigated ? <FiAlertTriangle size={12} /> : <FiShield size={12} />} {isMitigated ? 'Reopen' : 'Shield'}
                                                </motion.button>
                                                <button onClick={() => handleDelete(risk.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '8px' }} className="hover-text-red">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Pre-Mortem Scenario */}
                                        {premortems[risk.id] && (
                                            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0', padding: 16, marginBottom: 16, position: 'relative' }}>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FiActivity /> Simulation: 2 Years Post-Event</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6, fontStyle: 'italic' }}>"{premortems[risk.id]}"</div>
                                            </div>
                                        )}

                                        {/* Mitigation Plan */}
                                        {risk.mitigation_plan && (
                                            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8, borderLeft: `2px solid ${pColor}`, marginBottom: aiSteps[risk.id] ? 16 : 0 }}>
                                                <span style={{ color: pColor, fontWeight: 800, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 4 }}>Current Protocol: </span>{risk.mitigation_plan}
                                            </div>
                                        )}

                                        {/* AI Actionable Steps */}
                                        {Array.isArray(aiSteps[risk.id]) && (
                                            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 16, marginTop: 16 }}>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FiTarget /> AI Recommended Safeguards</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {aiSteps[risk.id].map((step, sIdx) => {
                                                        const taskKey = `${risk.id}_${sIdx}`;
                                                        const btnState = taskExportStatus[taskKey];
                                                        return (
                                                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 8 }}>
                                                                <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                                                                    <span style={{ color: '#60a5fa', fontWeight: 800, marginRight: 8 }}>{sIdx + 1}.</span>
                                                                    {step}
                                                                </div>
                                                                <button onClick={() => exportToTasks(step, risk.id, sIdx)} disabled={btnState === 'loading' || btnState === 'done'}
                                                                    style={{
                                                                        flexShrink: 0, padding: '4px 10px', fontSize: 10, fontWeight: 800, borderRadius: 6, cursor: btnState ? 'default' : 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)',
                                                                        background: btnState === 'done' ? 'rgba(16,185,129,0.2)' : btnState === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                                                                        color: btnState === 'done' ? '#10b981' : btnState === 'error' ? '#ef4444' : 'var(--text-2)'
                                                                    }}>
                                                                    {btnState === 'loading' ? <FiActivity className="spin" /> : btnState === 'done' ? '✓ Task Added' : btnState === 'error' ? 'Failed' : '+ Export Task'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
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
