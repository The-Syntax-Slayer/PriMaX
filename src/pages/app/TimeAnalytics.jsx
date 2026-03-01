import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPlus, FiTrash2, FiPieChart, FiActivity, FiZap, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiSun, FiMoon, FiCoffee } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const ACCENT = '#f59e0b';

const CATEGORIES = ['Deep Work', 'Meetings', 'Admin', 'Learning', 'Fitness', 'Social', 'Recovery', 'Wasted'];
const CATEGORY_COLORS = {
    'Deep Work': '#3b82f6', 'Meetings': '#8b5cf6', 'Admin': '#64748b',
    'Learning': '#0ea5e9', 'Fitness': '#10b981', 'Social': '#ec4899',
    'Recovery': '#22d3ee', 'Wasted': '#ef4444'
};

// ------------------------------------------------------------------
// GitHub-style Activity Heatmap Sub-Component
// ------------------------------------------------------------------
const ActivityHeatmap = ({ allocations }) => {
    // Group allocations by date string (YYYY-MM-DD)
    const activeDays = useMemo(() => {
        const map = {};
        allocations.forEach(a => {
            if (!a.date) return;
            const d = a.date.split('T')[0];
            // Weight deep work more for the visual intensity
            const weight = a.category === 'Deep Work' ? 1.5 : (a.category === 'Wasted' ? 0 : 1);
            map[d] = (map[d] || 0) + (a.duration_hours * weight);
        });
        return map;
    }, [allocations]);

    const cellSize = 10;
    const cellGap = 3;
    const weeks = 52;
    const daysInWeek = 7;

    // Generate the grid (columns of weeks, rows of days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start date (52 weeks ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * daysInWeek - 1));

    // Colors for intensity
    const getColor = (val) => {
        if (!val || val === 0) return 'rgba(255,255,255,0.03)';
        if (val < 2) return '#fde68a'; // yellow-200
        if (val < 4) return '#fbbf24'; // yellow-400
        if (val < 6) return '#f59e0b'; // yellow-500
        return '#d97706'; // yellow-600
    };

    const days = [];
    let curDate = new Date(startDate);
    for (let i = 0; i < weeks * daysInWeek; i++) {
        days.push(new Date(curDate));
        curDate.setDate(curDate.getDate() + 1);
    }

    return (
        <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks}, ${cellSize}px)`, gap: cellGap, width: 'max-content' }}>
                {Array.from({ length: daysInWeek }).map((_, rowIndex) => (
                    Array.from({ length: weeks }).map((_, colIndex) => {
                        const dayIndex = colIndex * daysInWeek + rowIndex;
                        const dateObj = days[dayIndex];
                        if (!dateObj) return <div key={`${rowIndex}-${colIndex}`} style={{ width: cellSize, height: cellSize }} />;

                        const dateStr = dateObj.toISOString().split('T')[0];
                        const val = activeDays[dateStr] || 0;

                        return (
                            <div key={dateStr} title={`${dateStr}: ${val.toFixed(1)} weighted hours`}
                                style={{
                                    width: cellSize, height: cellSize, borderRadius: 2,
                                    background: getColor(val),
                                    gridColumn: colIndex + 1, gridRow: rowIndex + 1,
                                    border: '1px solid rgba(0,0,0,0.1)'
                                }}
                            />
                        );
                    })
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>
                <span>Less</span>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.03)' }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fde68a' }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fbbf24' }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706' }} />
                <span>More</span>
            </div>
        </div>
    );
};


export default function TimeAnalytics() {
    const { user } = useAuth();
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // AI States
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [energyInsight, setEnergyInsight] = useState('');
    const [energyLoading, setEnergyLoading] = useState(false);

    // Using JSON stringify hack into `title` or `category` is bad, but adding columns is risky without migrations.
    // We will assume `metadata` JSONB exists. If not, we will gracefully degrade.
    // Our existing tables usually have a JSONB `ai_stats` or `metadata`. We'll just add to Supabase if it errors.
    const [formData, setFormData] = useState({
        title: '', duration_hours: 2, category: 'Deep Work',
        date: new Date().toISOString().split('T')[0],
        time_of_day: 'Morning', energy_level: 5
    });

    const fetchAllocations = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('time_allocations').select('*').eq('user_id', user?.id).order('date', { ascending: false });
        if (error) { console.error(error); setAllocations([]); }
        else setAllocations(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchAllocations(); }, [user, fetchAllocations]);
    useRealtimeRefresh('time_allocations', user?.id, fetchAllocations);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.title) return;

        // We will try to insert a new column `energy_level` and `time_of_day`.
        // To be safe, we'll just insert what we had, plus if the DB supports it, we'd add JSONB. 
        // For this demo, we can append energy info to the title cleanly as a fallback.
        const titleWithEnergy = `${formData.title} [E:${formData.energy_level}|${formData.time_of_day[0]}]`;

        const { data, error } = await supabase.from('time_allocations').insert({
            user_id: user.id,
            title: titleWithEnergy,
            duration_hours: formData.duration_hours,
            category: formData.category,
            date: formData.date,
            percentage: formData.energy_level // Hack: using percentage to store energy level since it's an int!
        }).select().single();

        if (!error && data) {
            setAllocations(prev => [data, ...prev]);
            setShowForm(false);
            setFormData({ ...formData, title: '', duration_hours: 2 });
        } else {
            console.error("Insert failed:", error);
            alert("Failed to log time.");
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('time_allocations').delete().eq('id', id);
        setAllocations(allocations.filter(a => a.id !== id));
    };

    const generateInsight = async () => {
        if (allocations.length === 0) return;
        setAiLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const summary = allocations.slice(0, 30).map(a => `"${a.category}": ${a.duration_hours}h (${a.title})`).join('\n');
            const prompt = `Analyze this person's time log and give a ruthless, high-performance productivity insight (max 2 sentences, no markdown). Highlight areas of critical time leakage and one specific optimization. \nLogs:\n${summary}`;
            const result = await model.generateContent(prompt);
            setAiInsight(result.response.text().trim().replace(/\*\*/g, ''));
        } catch (e) { console.error(e); }
        setAiLoading(false);
    };

    const generateEnergyMap = async () => {
        if (allocations.length === 0) return;
        setEnergyLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            // We encoded energy into percentage field. 1-10.
            const summary = allocations.slice(0, 40).map(a => `Time: ${a.title.includes('|M]') ? 'Morning' : a.title.includes('|A]') ? 'Afternoon' : a.title.includes('|E]') ? 'Evening' : 'Night'}, Energy: ${a.percentage}/10, Category: ${a.category}, Duration: ${a.duration_hours}h`).join('\n');
            const prompt = `Analyze this time/energy log. Discover their "Peak Energy Windows" and "Energy Slumps". \nLogs:\n${summary}\n\nReturn EXACTLY 3 short bullet points (with dashes, no bolding):\n1. The peak time for Deep Work based on energy.\n2. The worst energy slump time.\n3. A strategic schedule adjustment to maximize biological prime time.`;
            const result = await model.generateContent(prompt);
            setEnergyInsight(result.response.text().trim().replace(/\*\*/g, ''));
        } catch (e) { console.error(e); }
        setEnergyLoading(false);
    };

    // Calculate Leakage
    const wastedHours = allocations.filter(a => a.category === 'Wasted' || a.category === 'Admin').reduce((s, a) => s + (a.duration_hours || 0), 0);
    // Approximate annualized if we assume this log represents all time. Let's just do a direct extrapolation.
    // Find timespan of logs:
    const sortedDates = [...allocations].sort((a, b) => new Date(a.date) - new Date(b.date));
    let annualizedWasted = 0;
    let compoundWeeksLost = 0;
    if (sortedDates.length > 0) {
        const daysSpan = Math.max(1, (new Date(sortedDates[sortedDates.length - 1].date) - new Date(sortedDates[0].date)) / 86400000);
        const wastedPerDay = wastedHours / daysSpan;
        annualizedWasted = wastedPerDay * 365;
        compoundWeeksLost = annualizedWasted / 40; // 40-hour work weeks
    }

    // Aggregate by category
    const categoryTotals = allocations.reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + (a.duration_hours || 0);
        return acc;
    }, {});
    const totalHours = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    const DonutChart = () => {
        const size = 120; const cx = 60; const cy = 60; const r = 48; const stroke = 14;
        const cir = 2 * Math.PI * r;
        const entries = Object.entries(categoryTotals).filter(([, v]) => v > 0);
        let offset = 0;
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                {entries.map(([cat, val]) => {
                    const pct = val / totalHours;
                    const dash = pct * cir;
                    const gap = cir - dash;
                    const seg = <circle key={cat} cx={cx} cy={cy} r={r} fill="none" stroke={CATEGORY_COLORS[cat] || '#64748b'} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * cir} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />;
                    offset += pct;
                    return seg;
                })}
            </svg>
        );
    };

    return (
        <div className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.15 }}>
                <ParticleCanvas count={35} speed={0.4} color={ACCENT} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
                <header className="page-header" style={{ borderBottom: `1px solid ${ACCENT}30` }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                <FiClock size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #fcd34d, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Time Analytics
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • Energy Mapping, Time Leakage & Year Heatmaps</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #d97706)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Log Time'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }}
                                className="glass-card" style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Activity Focus *</label>
                                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. System Architecture Design" />
                                        </div>
                                        <div className="form-group">
                                            <label>Duration (hours)</label>
                                            <input type="number" min="0.25" max="24" step="0.25" value={formData.duration_hours} onChange={e => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Time of Day</label>
                                            <select value={formData.time_of_day} onChange={e => setFormData({ ...formData, time_of_day: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: 8, width: '100%' }}>
                                                {['Morning', 'Afternoon', 'Evening', 'Night'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Energy Level (1-10)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                                                <input type="range" min="1" max="10" value={formData.energy_level} onChange={e => setFormData({ ...formData, energy_level: parseInt(e.target.value) })} style={{ flex: 1 }} />
                                                <span style={{ fontWeight: 800, color: ACCENT, width: 24 }}>{formData.energy_level}</span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', background: ACCENT, border: 'none', padding: '10px 24px', fontSize: 13, fontWeight: 700 }}>Inject Time Block</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {allocations.length > 0 && (
                        <>
                            {/* Leakage Compounder & AI Features */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 20 }}>

                                <div className="glass-card" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', marginBottom: 12 }}>
                                        <FiAlertTriangle size={18} />
                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Leakage Compounder</h3>
                                    </div>
                                    <p style={{ margin: '0 0 16px', color: '#fca5a5', fontSize: 12, lineHeight: 1.5 }}>
                                        AI extrapolated your "Wasted" and "Admin" logs over a 12-month period to project compound time interest lost.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>ANNUALIZED HOURS LOST</div>
                                            <div style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Orbitron, monospace' }}>{annualizedWasted.toFixed(0)} <span style={{ fontSize: 14, color: '#fca5a5' }}>hrs/yr</span></div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>EQUIVALENT WORK WEEKS BURNT</div>
                                            <div style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Orbitron, monospace' }}>{compoundWeeksLost.toFixed(1)} <span style={{ fontSize: 14, color: '#fca5a5' }}>weeks</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* AI Insight Card */}
                                    <div className="glass-card" style={{ flex: 1, border: '1px solid rgba(124,58,237,0.3)', background: 'linear-gradient(135deg, rgba(124,58,237,0.05), transparent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiInsight ? 12 : 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}><FiZap /> Meta-Cognitive Insight</div>
                                            <button onClick={generateInsight} disabled={aiLoading} className="btn-primary" style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                                                {aiLoading ? <FiActivity className="spin" /> : 'Run Diagnostics'}
                                            </button>
                                        </div>
                                        {aiInsight && <p style={{ margin: 0, color: 'white', fontSize: 13, lineHeight: 1.6 }}>"{aiInsight}"</p>}
                                    </div>

                                    {/* Energy Mapping Card */}
                                    <div className="glass-card" style={{ flex: 1, border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: energyInsight ? 12 : 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}><FiSun /> Energy Optimization Map</div>
                                            <button onClick={generateEnergyMap} disabled={energyLoading} className="btn-primary" style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                                                {energyLoading ? <FiActivity className="spin" /> : 'Map Energy Cycles'}
                                            </button>
                                        </div>
                                        {energyInsight && (
                                            <div style={{ color: 'white', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{energyInsight}</div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* GitHub-style Heatmap */}
                            <div className="glass-card" style={{ marginBottom: 20 }}>
                                <h3 style={{ color: 'white', margin: '0 0 4px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FiActivity size={16} color={ACCENT} /> Output Intensity Heatmap (365 Days)</h3>
                                <p style={{ margin: '0 0 16px', color: 'var(--text-3)', fontSize: 12 }}>Visualizing your deep work and total hours committed over the past year. Deep Work carries heavier weighting.</p>
                                <ActivityHeatmap allocations={allocations} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20 }}>
                                {/* Category Distribution Bars */}
                                <div className="glass-card">
                                    <h3 style={{ color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}><FiPieChart size={16} color={ACCENT} /> Distribution Matrix</h3>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                        <div style={{ position: 'relative' }}>
                                            <DonutChart />
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 900, color: 'white' }}>{totalHours.toFixed(0)}h</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, hours]) => {
                                            const pct = Math.round((hours / totalHours) * 100);
                                            const color = CATEGORY_COLORS[cat] || '#64748b';
                                            return (
                                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                                    <div style={{ width: 80, fontSize: 12, color: 'var(--text-1)', fontWeight: 700 }}>{cat}</div>
                                                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}60` }} />
                                                    </div>
                                                    <div style={{ width: 50, fontSize: 11, color: color, fontWeight: 800, textAlign: 'right' }}>{hours.toFixed(1)}h</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Raw Logs */}
                                <div className="glass-card">
                                    <h3 style={{ color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}><FiClock size={16} color={ACCENT} /> Sector Log</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {allocations.slice(0, 15).map(a => {
                                            const color = CATEGORY_COLORS[a.category] || '#64748b';
                                            const cleanTitle = a.title.replace(/\s\[E:\d+\|[MANE]\]/g, ''); // RegEx to clean our hacky title
                                            return (
                                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                                                    <div style={{ flex: 1, fontSize: 13, color: 'white', fontWeight: 600 }}>{cleanTitle}</div>
                                                    <span style={{ fontSize: 10, color, fontWeight: 800, background: `${color}15`, border: `1px solid ${color}30`, padding: '2px 8px', borderRadius: 100 }}>{a.category}</span>
                                                    <span style={{ fontSize: 12, color: ACCENT, fontWeight: 800, whiteSpace: 'nowrap' }}>{a.duration_hours}h</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', width: 60, textAlign: 'right' }}>{a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                                    <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} className="hover-text-red"><FiTrash2 size={14} /></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!loading && allocations.length === 0 && (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiClock size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>No Matrix Data</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Inject First Time Block</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
