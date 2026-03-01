import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiPlus, FiTrash2, FiMessageCircle, FiCalendar, FiStar, FiHeart, FiBriefcase, FiZap, FiAlertCircle, FiActivity, FiGift, FiX } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ParticleCanvas from '../../components/ParticleCanvas';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const ACCENT = '#ec4899';

function getDaysSince(dateStr) {
    if (!dateStr) return null;
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

function initials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRelIcon(rel) {
    switch (rel) {
        case 'Mentor': return <FiStar size={15} />;
        case 'Colleague': return <FiBriefcase size={15} />;
        case 'Family': return <FiHeart size={15} />;
        default: return <FiUsers size={15} />;
    }
}

// ------------------------------------------------------------------
// Health Matrix Sub-Component
// ------------------------------------------------------------------
const HealthMatrix = ({ contacts, onSelectContact }) => {
    // We map: X Axis = Days Since Last Contact (0 to 120 days).
    // Y Axis = Target Follow Up Frequency (0 to 120 days).
    // Lower Y = High Priority. (Bottom side of graph)
    // Higher X = Stale. (Right side of graph)
    // Therefore Bottom-Right quadrant is Danger Zone.

    const MAX_VAL = 120; // Cap days at 120 for the scale

    return (
        <div style={{ position: 'relative', height: 500, background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 40, marginTop: 20 }}>
            {/* Grid Lines */}
            <div style={{ position: 'absolute', inset: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ position: 'absolute', top: '50%', width: '100%', height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', left: '50%', height: '100%', width: 1, background: 'rgba(255,255,255,0.1)' }} />

                {/* Quadrant Labels */}
                <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, color: 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Low Priority / Recent</div>
                <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, color: 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Low Priority / Stale</div>
                <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 10, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Healthy Relationships</div>
                <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 10, color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Danger Zone</div>
            </div>

            {/* Axis Labels */}
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>Days Since Last Contact →</div>
            <div style={{ position: 'absolute', top: '50%', left: -20, transform: 'translateY(-50%) rotate(-90deg)', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Target Follow-up Days ↓</div>

            <div style={{ position: 'absolute', bottom: 20, left: 40, fontSize: 10, color: 'var(--text-3)' }}>0d</div>
            <div style={{ position: 'absolute', bottom: 20, right: 40, fontSize: 10, color: 'var(--text-3)' }}>120d+</div>
            <div style={{ position: 'absolute', top: 40, left: 15, fontSize: 10, color: 'var(--text-3)' }}>120d+</div>
            <div style={{ position: 'absolute', bottom: 40, left: 20, fontSize: 10, color: 'var(--text-3)' }}>1d</div>

            {/* Data Points */}
            <div style={{ position: 'absolute', inset: '40px', overflow: 'hidden' }}>
                {contacts.map(c => {
                    const daysSince = Math.min(Math.max(0, getDaysSince(c.last_contact_date) || 0), MAX_VAL);
                    const targetDays = Math.min(Math.max(1, c.follow_up_days || 30), MAX_VAL);

                    // Calc percentages (Y axis is inverted in DOM: 0% is top, 100% is bottom.
                    // If targetDays is small (e.g. 7d = High Priority), we want it at the BOTTOM.
                    // So Y% = 100 - (targetDays/MAX * 100)
                    const xPos = (daysSince / MAX_VAL) * 100;
                    const yPos = 100 - (targetDays / MAX_VAL) * 100;

                    const isDanger = xPos > 50 && yPos > 50;

                    return (
                        <motion.div key={c.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            onClick={() => onSelectContact(c)}
                            style={{
                                position: 'absolute',
                                left: `${xPos}%`,
                                bottom: `${yPos}%`,
                                transform: 'translate(-50%, 50%)',
                                cursor: 'pointer',
                                zIndex: isDanger ? 10 : 1
                            }}>
                            <motion.div whileHover={{ scale: 1.5, zIndex: 100 }} style={{ position: 'relative' }}>
                                <div style={{
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: c.color, border: '2px solid var(--app-surface)',
                                    boxShadow: isDanger ? '0 0 10px #ef4444' : `0 0 5px ${c.color}`,
                                    position: 'relative'
                                }} />
                                {/* Pulsing effect for danger zone items */}
                                {isDanger && (
                                    <div className="pulse" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #ef4444', animation: 'pulse 2s infinite' }} />
                                )}
                                <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', textShadow: '0 1px 3px black' }}>
                                    {c.name}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>
            <style>{`@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }`}</style>
        </div>
    );
};

export default function Social() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'matrix'
    const [aiLoading, setAiLoading] = useState(null);
    const [starters, setStarters] = useState({});

    // VIP Gift / Idea Recommender State
    const [vipContact, setVipContact] = useState(null);
    const [vipIdeas, setVipIdeas] = useState(null);

    const [formData, setFormData] = useState({
        name: '', relationship: 'Friend', company: '', next_contact_date: '', birthday: '', follow_up_days: 14, notes: '', color: ACCENT
    });

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('social_contacts').select('*').eq('user_id', user?.id).order('next_contact_date', { ascending: true, nullsFirst: false });
        if (error) { console.error(error); setContacts([]); }
        else setContacts(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) fetchContacts(); }, [user, fetchContacts]);
    useRealtimeRefresh('social_contacts', user?.id, fetchContacts);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || !formData.name) return;
        const { data, error } = await supabase.from('social_contacts').insert({
            user_id: user.id, name: formData.name, relationship: formData.relationship,
            company: formData.company || null, birthday: formData.birthday || null,
            next_contact_date: formData.next_contact_date || null, follow_up_days: formData.follow_up_days || 14,
            notes: formData.notes, color: formData.color,
            last_contact_date: new Date().toISOString().split('T')[0],
            interaction_logs: [] // explicitly Initialize
        }).select().single();
        if (!error && data) {
            setContacts([data, ...contacts]);
            setShowForm(false);
            setFormData({ name: '', relationship: 'Friend', company: '', next_contact_date: '', birthday: '', follow_up_days: 14, notes: '', color: ACCENT });
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('social_contacts').delete().eq('id', id);
        setContacts(contacts.filter(c => c.id !== id));
    };

    const logInteraction = async (contact) => {
        const today = new Date().toISOString().split('T')[0];
        const days = contact.follow_up_days || 14;
        const nextDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

        // Push to interaction_logs array
        const currentLogs = contact.interaction_logs || [];
        const newLogs = [{ date: today, notes: '' }, ...currentLogs].slice(0, 10); // keep last 10

        await supabase.from('social_contacts').update({
            last_contact_date: today,
            next_contact_date: nextDate,
            interaction_logs: newLogs
        }).eq('id', contact.id);

        setContacts(contacts.map(c => c.id === contact.id ? { ...c, last_contact_date: today, next_contact_date: nextDate, interaction_logs: newLogs } : c));
    };

    const generateStarter = async (contact) => {
        setAiLoading(`starter_${contact.id}`);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Give me 2 friendly conversation opener ideas to reconnect with ${contact.name}, a ${contact.relationship}${contact.company ? ` at ${contact.company}` : ''}. Keep it warm and natural. Notes: "${contact.notes || 'none'}". No markdown, just plain text, numbered 1 and 2.`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/\*\*/g, '');
            setStarters(prev => ({ ...prev, [contact.id]: text }));
        } catch (e) { console.error(e); }
        setAiLoading(null);
    };

    const generateVipGift = async (contact) => {
        setAiLoading(`vip_${contact.id}`);
        setVipContact(contact);
        setVipIdeas(null); // clear old ideas
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `I want to send a meaningful, highly-personalized gift or do a unique follow-up activity with ${contact.name}. 
            Relationship: ${contact.relationship}. Company: ${contact.company || 'Unknown'}. 
            Context/Notes: "${contact.notes || 'None'}".
            Suggest 3 extremely specific, non-generic, delightful ideas (gifts under $50, or thoughtful digital gestures/activities). 
            Return a JSON array of 3 objects: [{"idea": "Short title", "reason": "Why it's perfect"}]. No markdown wrapping.`;
            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
            setVipIdeas(JSON.parse(text));
        } catch (e) { console.error(e); alert("Failed to generate VIP suggestions."); setVipContact(null); }
        setAiLoading(null);
    };

    const overdueContacts = contacts.filter(c => c.next_contact_date && Math.ceil((new Date(c.next_contact_date) - new Date()) / 86400000) < 0);
    const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
                                <FiUsers size={20} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, #f9a8d4, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Social Intelligence
                            </h1>
                            <div style={{ marginLeft: 16, display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                                <button onClick={() => setViewMode('grid')} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: viewMode === 'grid' ? ACCENT : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-3)', border: 'none', cursor: 'pointer' }}>Cards</button>
                                <button onClick={() => setViewMode('matrix')} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: viewMode === 'matrix' ? ACCENT : 'transparent', color: viewMode === 'matrix' ? 'white' : 'var(--text-3)', border: 'none', cursor: 'pointer' }}>Health Matrix</button>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Beast Mode • Health matrices, interactive timelines & AI VIP suggestions</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(!showForm)} className="btn-primary"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}, #db2777)`, border: 'none' }}>
                        <FiPlus /> {showForm ? 'Cancel' : 'Add Contact'}
                    </motion.button>
                </header>

                <div style={{ padding: '24px 32px' }}>

                    {/* Overdue Alert */}
                    {overdueContacts.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 20 }}>
                            <FiAlertCircle size={16} color="#ef4444" />
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{overdueContacts.length} VIP{overdueContacts.length > 1 ? 's' : ''} slipping away: </span>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{overdueContacts.map(c => c.name).join(', ')}</span>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }}
                                className="glass-card" style={{ marginBottom: 24, border: `1px solid ${ACCENT}40`, background: `linear-gradient(180deg, ${ACCENT}08, transparent)` }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: ACCENT, marginBottom: 20 }}><FiUsers /> Add Connection</h3>
                                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group"><label>Full Name *</label><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                        <div className="form-group"><label>Relationship</label><select value={formData.relationship} onChange={e => setFormData({ ...formData, relationship: e.target.value })}>{['Mentor', 'Colleague', 'Friend', 'Family', 'Client', 'Investor'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                        <div className="form-group"><label>Company / Role</label><input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} /></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group"><label>Next Follow-Up Date</label><input type="date" value={formData.next_contact_date} onChange={e => setFormData({ ...formData, next_contact_date: e.target.value })} /></div>
                                        <div className="form-group"><label>Birthday</label><input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} /></div>
                                        <div className="form-group"><label>Re-contact Target (Days)</label><input type="number" min={1} max={365} value={formData.follow_up_days} onChange={e => setFormData({ ...formData, follow_up_days: parseInt(e.target.value) })} /></div>
                                    </div>
                                    <div className="form-group">
                                        <label>Intel / Notes</label>
                                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Spouse's name, hobbies, last big win..." rows={2} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        {COLORS.map(c => (
                                            <div key={c} onClick={() => setFormData({ ...formData, color: c })} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: formData.color === c ? '2.5px solid white' : '2px solid transparent', boxShadow: formData.color === c ? `0 0 10px ${c}` : 'none', opacity: formData.color === c ? 1 : 0.4 }} />
                                        ))}
                                        <button type="submit" className="btn-primary" style={{ marginLeft: 'auto', background: ACCENT, border: 'none' }}>Log VIP</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}><FiActivity className="spin" /> Scanning networks...</div>
                    ) : contacts.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: ACCENT }}><FiUsers size={32} /></div>
                            <h3 style={{ color: 'white', marginBottom: 10 }}>Empty Rolodex</h3>
                            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background: ACCENT, border: 'none' }}><FiPlus /> Track First VIP</button>
                        </div>
                    ) : viewMode === 'matrix' ? (
                        <HealthMatrix contacts={contacts} onSelectContact={() => { }} />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                            {contacts.map(contact => {
                                const daysSince = getDaysSince(contact.last_contact_date);
                                const daysUntil = contact.next_contact_date ? Math.ceil((new Date(contact.next_contact_date) - new Date()) / 86400000) : null;
                                const isOverdue = daysUntil !== null && daysUntil < 0;
                                const logs = contact.interaction_logs || [];

                                return (
                                    <motion.div key={contact.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                        className="glass-card hover-glow" style={{ borderTop: `3px solid ${contact.color}`, display: 'flex', flexDirection: 'column' }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${contact.color}20`, color: contact.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${contact.color}50`, fontSize: 16, fontWeight: 800 }}>
                                                    {initials(contact.name)}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 800 }}>{contact.name}</h3>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                        <span style={{ fontSize: 11, color: contact.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>{getRelIcon(contact.relationship)}{contact.relationship}</span>
                                                        {contact.company && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>• {contact.company}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(contact.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} className="hover-text-red">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Timeline Log Preview */}
                                        {logs.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflow: 'hidden' }}>
                                                {logs.map((log, i) => (
                                                    <div key={i} title={log.date} style={{ width: 14, height: 14, borderRadius: 3, background: `${contact.color}${Math.max(10, 90 - (i * 15))}`, border: '1px solid rgba(255,255,255,0.1)' }} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {contact.notes && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, borderLeft: `2px solid ${contact.color}` }}>"{contact.notes}"</p>}

                                        {/* Action Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 6, marginBottom: 16 }}>
                                            <motion.button whileHover={{ scale: 1.02 }} onClick={() => logInteraction(contact)} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 800, background: `${contact.color}15`, border: `1px solid ${contact.color}40`, color: contact.color, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <FiCheckCircle size={14} /> Log Connect
                                            </motion.button>
                                            <button onClick={() => generateStarter(contact)} disabled={aiLoading === `starter_${contact.id}`} className="btn-primary" style={{ padding: '8px 10px', fontSize: 11, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                                                {aiLoading === `starter_${contact.id}` ? <FiActivity className="spin" /> : <FiMessageCircle />} Intro
                                            </button>
                                            <button onClick={() => generateVipGift(contact)} disabled={aiLoading === `vip_${contact.id}`} className="btn-primary" style={{ padding: '8px 10px', fontSize: 11, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                                                {aiLoading === `vip_${contact.id}` ? <FiActivity className="spin" /> : <FiGift />} Gift
                                            </button>
                                        </div>

                                        {starters[contact.id] && (
                                            <div style={{ marginBottom: 16, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 12 }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FiMessageCircle /> Openers</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{starters[contact.id]}</div>
                                            </div>
                                        )}

                                        {/* Meta Stats Base */}
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 12 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)' }}>LAST CONTACT</span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{daysSince === null ? 'Never' : daysSince === 0 ? 'Today' : `${daysSince}d ago`}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: isOverdue ? '#ef4444' : 'var(--text-3)' }}>NEXT TARGET</span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#ef4444' : 'white' }}>{daysUntil === null ? 'Not set' : daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Today' : `In ${daysUntil}d`}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* VIP GIFT RECOMMENDER MODAL */}
            <AnimatePresence>
                {vipContact && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 32, background: 'var(--app-surface)', border: `1px solid ${vipContact.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: vipContact.color }}>
                                    <FiGift size={24} />
                                    <h2 style={{ margin: 0, fontSize: 20 }}>VIP Recommender</h2>
                                </div>
                                <button onClick={() => setVipContact(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FiX size={24} /></button>
                            </div>

                            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>
                                AI brainstorms tailored follow-up gestures for <strong>{vipContact.name}</strong>.
                            </p>

                            {!vipIdeas ? (
                                <div style={{ padding: 40, textAlign: 'center', color: vipContact.color }}><FiActivity size={32} className="spin" /></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {vipIdeas.map((idea, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: 14, color: 'white' }}>{idea.idea}</h4>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{idea.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

// Ensure FiCheckCircle is made available by redefining or importing
const FiCheckCircle = FiCheck;
import { FiCheck } from 'react-icons/fi';
