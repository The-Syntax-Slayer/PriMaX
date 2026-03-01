import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiPlus, FiTrash2, FiZap, FiTarget, FiAlertCircle, FiTrendingUp, FiFastForward, FiGitBranch, FiActivity, FiEyeOff } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const ACCENT = '#a855f7';

// ------------------------------------------------------------------
// Custom SVG Trajectory Graph (Wealth, Health, Happiness)
// ------------------------------------------------------------------
const TrajectoryGraph = ({ metrics, color }) => {
    if (!metrics || metrics.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    // Normalization functions (Assuming all metrics are 0-100)
    const getX = (index) => padding.left + (index / Math.max(1, metrics.length - 1)) * innerWidth;
    const getY = (val) => padding.top + innerHeight - (Math.max(0, Math.min(100, val)) / 100) * innerHeight;

    const createPath = (key) => {
        return metrics.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(m[key])}`).join(' ');
    };

    const lines = [
        { key: 'wealth', color: '#10b981', label: 'Wealth' },
        { key: 'health', color: '#ef4444', label: 'Health' },
        { key: 'happiness', color: '#3b82f6', label: 'Satisfaction' }
    ];

    return (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingLeft: padding.left }}>
                {lines.map(l => (
                    <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} /> {l.label}
                    </div>
                ))}
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
                {/* Y Axis Grid Lines */}
                {[0, 25, 50, 75, 100].map(val => (
                    <g key={val}>
                        <text x={padding.left - 10} y={getY(val)} fill="var(--text-3)" fontSize="10" textAnchor="end" dominantBaseline="middle">{val}</text>
                        <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                    </g>
                ))}

                {/* X Axis Years */}
                {metrics.map((m, i) => (
                    <text key={i} x={getX(i)} y={height - 5} fill="var(--text-3)" fontSize="10" textAnchor="middle">Yr {m.year}</text>
                ))}

                {/* Data Lines & Points */}
                {lines.map(l => (
                    <g key={l.key}>
                        <path d={createPath(l.key)} fill="none" stroke={l.color} strokeWidth="2.5"
                            style={{ filter: `drop-shadow(0px 2px 4px ${l.color}80)` }}
                            strokeLinecap="round" strokeLinejoin="round" />
                        {metrics.map((m, i) => (
                            <circle key={i} cx={getX(i)} cy={getY(m[l.key])} r="4" fill="var(--app-surface)" stroke={l.color} strokeWidth="2" />
                        ))}
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default function LifeSimulator() {
    const { user } = useAuth();
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [blackSwanLoading, setBlackSwanLoading] = useState(null);

    const [formData, setFormData] = useState({
        title: '', context: '', branchA: '', branchB: '', timeframe_years: 5, color: ACCENT
    });

    const fetchSimulations = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('simulations').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        if (error) { console.error(error); setSimulations([]); }
        else setSimulations(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchSimulations(); }, [user, fetchSimulations]);
    useRealtimeRefresh('simulations', user?.id, fetchSimulations);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title || !formData.branchA) return;
        setSimulating(true);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `You are a predictive life-planning AI. Simulate a ${formData.timeframe_years}-year life trajectory.
Decision/Goal: "${formData.title}"
Context: "${formData.context || 'None'}"

Branch A: ${formData.branchA}
${formData.branchB ? `Branch B: ${formData.branchB}` : ''}

Generate structured predictions for the branches. Ensure the "metrics" array covers at least Year 0, the midpoint, and the final year. Metrics are values from 1-100 predicting subjective states over time.
Return ONLY a valid JSON. NO markdown format:
{
  "scenarios": [
    {
      "name": "Branch A",
      "summaryPrediction": "2-3 sentences.",
      "feasibilityScore": 75,
      "feasibilityNote": "Short reason.",
      "milestones": [ { "year": 1, "event": "...", "type": "progress" } ],
      "riskFactors": ["..."],
      "upsidePotential": ["..."],
      "metrics": [ { "year": 0, "wealth": 30, "health": 80, "happiness": 60 }, { "year": ${formData.timeframe_years}, "wealth": 70, "health": 60, "happiness": 80 } ]
    }
  ]
}`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const aiPrediction = JSON.parse(text);

            const { data, error } = await supabase.from('simulations').insert({
                user_id: user.id, title: formData.title, context: formData.context,
                timeframe_years: formData.timeframe_years, ai_prediction: aiPrediction,
                color: formData.color
            }).select().single();

            if (!error && data) {
                setSimulations([data, ...simulations]);
                setShowForm(false);
                setFormData({ title: '', context: '', branchA: '', branchB: '', timeframe_years: 5, color: ACCENT });
            }
        } catch (err) { console.error(err); alert("Simulation failed."); }
        setSimulating(false);
    };

    const handleDelete = async (id) => {
        await supabase.from('simulations').delete().eq('id', id);
        setSimulations(simulations.filter(s => s.id !== id));
    };

    const injectBlackSwan = async (sim, scenarioIdx) => {
        setBlackSwanLoading(`${sim.id}_${scenarioIdx}`);
        try {
            const ai = sim.ai_prediction;
            const scenario = ai.scenarios ? ai.scenarios[scenarioIdx] : sim.ai_prediction; // fallback for legacy

            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Take this simulated life scenario: "${scenario.summaryPrediction}". Time horizon is ${sim.timeframe_years} years.
            Inject a highly disruptive, unexpected "Black Swan" event (could be massively negative like a global crisis or chronic illness, or massively positive like a paradigm-shifting technological breakthrough or jackpot).
            Change the trajectory completely starting from an arbitrary mid-point year.
            
            Return ONLY a valid JSON replacing the trajectory:
            {
              "blackSwanEvent": "Name of the shocking event",
              "summaryPrediction": "New summary of how life ended up.",
              "feasibilityScore": 20,
              "milestones": [ { "year": 1, "event": "Normal...", "type": "progress" }, { "year": 3, "event": "BLACK SWAN HITS: ...", "type": "shock" } ],
              "riskFactors": ["..."],
              "upsidePotential": ["..."],
              "metrics": [ { "year": 1, "wealth": 50, "health": 80, "happiness": 60 }, { "year": ${sim.timeframe_years}, "wealth": 10, "health": 40, "happiness": 30 } ]
            }`;

            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            const newScenarioData = JSON.parse(text);

            let updatedAi;
            if (ai.scenarios) {
                const newScenarios = [...ai.scenarios];
                newScenarios[scenarioIdx] = { ...scenario, ...newScenarioData, isBlackSwan: true };
                updatedAi = { ...ai, scenarios: newScenarios };
            } else {
                updatedAi = { ...ai, ...newScenarioData, isBlackSwan: true }; // Legacy single scenario
            }

            await supabase.from('simulations').update({ ai_prediction: updatedAi }).eq('id', sim.id);
            setSimulations(simulations.map(s => s.id === sim.id ? { ...s, ai_prediction: updatedAi } : s));

        } catch (err) { console.error(err); alert("Failed to generate Black Swan."); }
        setBlackSwanLoading(null);
    };

    const getFeasibilityColor = (score) => score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.2 }}>
                <ParticleCanvas count={35} speed={0.4} color={ACCENT} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiCpu size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #d8b4fe, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Life Simulator
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • A/B Branching, Black Swans, & 10-Year Trajectory Graphs</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, border: 'none' }} disabled={simulating}>
                        {simulating ? <FiZap className="spin" /> : <FiPlus />}
                        {simulating ? 'Running Matrix...' : showForm ? 'Cancel' : 'New Simulation'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }}
                                className="glass-card" style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}><FiGitBranch /> Configure Dual-Scenario Simulation</h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                        <div className="form-group"><label>Simulation Overview *</label><input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Career Transition Path" disabled={simulating} /></div>
                                        <div className="form-group"><label>Time Horizon (years)</label><select value={formData.timeframe_years} onChange={e => setFormData({ ...formData, timeframe_years: parseInt(e.target.value) })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>{[1, 3, 5, 10, 20].map(y => <option key={y} value={y}>{y} yrs</option>)}</select></div>
                                    </div>
                                    <div className="form-group"><label>Current Context / Baseline</label><textarea value={formData.context} onChange={e => setFormData({ ...formData, context: e.target.value })} placeholder="Describe your starting point, constraints, and baseline metrics..." rows={2} disabled={simulating} /></div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group" style={{ background: 'rgba(59,130,246,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)' }}>
                                            <label style={{ color: '#60a5fa' }}>Branch A (Default Path) *</label>
                                            <textarea required value={formData.branchA} onChange={e => setFormData({ ...formData, branchA: e.target.value })} placeholder="e.g. Stay at current job and aim for promotion..." rows={3} disabled={simulating} style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                        <div className="form-group" style={{ background: 'rgba(16,185,129,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                                            <label style={{ color: '#34d399' }}>Branch B (Alternate Path)</label>
                                            <textarea value={formData.branchB} onChange={e => setFormData({ ...formData, branchB: e.target.value })} placeholder="e.g. Quit and start an AI startup in my garage..." rows={3} disabled={simulating} style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'center', padding: '12px 32px', fontSize: 14, marginTop: 10, background: ACCENT, border: 'none' }} disabled={simulating}>
                                        {simulating ? <><FiActivity className="spin" /> Processing AI Timelines...</> : <><FiFastForward /> Run Trajectory Simulation</>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiActivity className="spin" /> Quantum processing...</div>
                    ) : simulations.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiCpu size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>No Simulations Running</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Initialize First Branching Model</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            {simulations.map(sim => {
                                const ai = sim.ai_prediction;
                                // Normalize legacy data
                                const scenarios = ai.scenarios || [ai];

                                return (
                                    <motion.div key={sim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-card" style={{ padding: 0, borderTop: `4px solid ${sim.color || ACCENT}`, overflow: 'hidden' }}>

                                        <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                                        <h2 style={{ margin: 0, color: 'white', fontSize: 22, fontWeight: 800 }}>{sim.title}</h2>
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: sim.color || ACCENT, background: `${sim.color || ACCENT}15`, border: `1px solid ${sim.color || ACCENT}40`, padding: '2px 8px', borderRadius: 100 }}>{sim.timeframe_years}yr horizon</span>
                                                    </div>
                                                    {sim.context && <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>{sim.context}</p>}
                                                </div>
                                                <button onClick={() => handleDelete(sim.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 8 }} className="hover-text-red"><FiTrash2 size={16} /></button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: scenarios.length > 1 ? '1fr 1fr' : '1fr', gap: 24, padding: 24 }}>
                                            {scenarios.map((scenario, idx) => {
                                                const feasScore = scenario.feasibilityScore || 70;
                                                const feasColor = getFeasibilityColor(feasScore);
                                                const sColor = idx === 0 ? '#3b82f6' : '#10b981'; // Blue for A, Green for B
                                                const isBlackSwan = scenario.isBlackSwan;

                                                return (
                                                    <div key={idx} style={{ background: `linear-gradient(180deg, ${sColor}05, transparent)`, border: `1px solid ${isBlackSwan ? '#ef4444' : sColor}40`, borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>

                                                        {isBlackSwan && (
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}><FiEyeOff /> System Shock Active: {scenario.blackSwanEvent}</div>
                                                        )}

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: isBlackSwan ? 16 : 0 }}>
                                                            <h3 style={{ margin: 0, color: isBlackSwan ? '#ef4444' : sColor, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><FiGitBranch /> {scenario.name || `Scenario ${idx + 1}`}</h3>

                                                            {!isBlackSwan && (
                                                                <button onClick={() => injectBlackSwan(sim, idx)} disabled={blackSwanLoading === `${sim.id}_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                                    {blackSwanLoading === `${sim.id}_${idx}` ? <FiZap className="spin" /> : <FiAlertCircle />} Inject Black Swan
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 20 }}>
                                                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, color: isBlackSwan ? '#ef4444' : feasColor, lineHeight: 1 }}>{feasScore}%</div>
                                                                <div style={{ fontSize: 9, color: isBlackSwan ? '#ef4444' : feasColor, fontWeight: 800, marginTop: 4 }}>FEASIBILITY</div>
                                                            </div>
                                                            <p style={{ margin: 0, color: 'white', fontSize: 13, lineHeight: 1.6 }}>{scenario.summaryPrediction}</p>
                                                        </div>

                                                        {/* Advanced Graph */}
                                                        {scenario.metrics && scenario.metrics.length > 0 && (
                                                            <div style={{ marginBottom: 24 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Metric Forecasting</div>
                                                                <TrajectoryGraph metrics={scenario.metrics} />
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                            <div style={{ position: 'relative', paddingLeft: 16 }}>
                                                                <div style={{ position: 'absolute', left: 4, top: 4, bottom: 0, width: 2, background: `linear-gradient(180deg, ${isBlackSwan ? '#ef4444' : sColor}, transparent)` }} />
                                                                {scenario.milestones?.map((m, i) => (
                                                                    <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
                                                                        <div style={{ position: 'absolute', left: -15, top: 4, width: 8, height: 8, borderRadius: '50%', background: m.type === 'shock' ? '#ef4444' : sColor }} />
                                                                        <div style={{ fontSize: 10, color: m.type === 'shock' ? '#ef4444' : sColor, fontWeight: 800, marginBottom: 2 }}>Year {m.year}</div>
                                                                        <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4, fontWeight: m.type === 'shock' ? 700 : 400 }}>{m.event}</div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                                {scenario.riskFactors?.length > 0 && (
                                                                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: 12, borderRadius: 8 }}>
                                                                        <h4 style={{ color: '#ef4444', margin: '0 0 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><FiAlertCircle size={10} /> Risks</h4>
                                                                        <ul style={{ margin: 0, paddingLeft: 14, color: 'var(--text-2)', fontSize: 11 }}>{scenario.riskFactors.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                                                    </div>
                                                                )}
                                                                {scenario.upsidePotential?.length > 0 && (
                                                                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: 12, borderRadius: 8 }}>
                                                                        <h4 style={{ color: '#10b981', margin: '0 0 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><FiTrendingUp size={10} /> Upsides</h4>
                                                                        <ul style={{ margin: 0, paddingLeft: 14, color: 'var(--text-2)', fontSize: 11 }}>{scenario.upsidePotential.map((u, i) => <li key={i}>{u}</li>)}</ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>

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
