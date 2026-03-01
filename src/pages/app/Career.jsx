import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBriefcase, FiPlus, FiTrash2, FiTarget, FiCheck,
    FiX, FiZap, FiRotateCcw, FiFileText, FiMessageCircle,
    FiSearch, FiBarChart2, FiMap, FiEdit3, FiClock,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, generateCareerRoadmap, generateInterviewQuestions, SYSTEM_PROMPTS } from '../../lib/aiService';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';

const TABS = [
    { id: 'roadmap', label: 'Career Roadmap', icon: <FiMap size={14} /> },
    { id: 'skills', label: 'Skills', icon: <FiBarChart2 size={14} /> },
    { id: 'jobs', label: 'Job Tracker', icon: <FiSearch size={14} /> },
    { id: 'resume', label: 'Resume Builder', icon: <FiFileText size={14} /> },
    { id: 'interview', label: 'Interview Prep', icon: <FiMessageCircle size={14} /> },
    { id: 'ai', label: 'AI Coach', icon: <FiZap size={14} /> },
];

const statusColors = { Applied: '#5a5a80', Screening: '#f59e0b', Interview: '#7c3aed', Offer: '#10b981', Rejected: '#ef4444' };
const diffColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const catColors = { Behavioral: '#7c3aed', 'System Design': '#00f5ff', Technical: '#f59e0b' };

const TAG_COLORS = ['#7c3aed', '#00f5ff', '#10b981', '#f59e0b', '#ec4899', '#f97316'];

const Card = ({ children, style = {} }) => (
    <div style={{ borderRadius: 18, background: 'var(--app-surface)', border: '1px solid var(--app-border)', padding: 22, ...style }}>{children}</div>
);
const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d } });

const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ display: 'inline-flex' }}>
        <FiRotateCcw size={13} />
    </motion.div>
);

const EmptyState = ({ icon, title, desc, cta, onCta }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.7 }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>{desc}</div>
        {cta && <button onClick={onCta} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{cta}</button>}
    </div>
);

/* ═══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                         */
/* ═══════════════════════════════════════════════════════ */
export default function Career() {
    const { user } = useAuth();
    const [tab, setTab] = useState('roadmap');
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('career_profiles').select('*').eq('user_id', user.id).single();
        setProfile(data || null);
        setLoadingProfile(false);
    }, [user]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);
    useRealtimeRefresh('career_profiles', user?.id, fetchProfile);

    if (loadingProfile) return (
        <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <Spinner />
        </div>
    );

    /* No career profile yet — show setup form */
    if (!profile) return (
        <div className="page-shell">
            <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
                <div className="page-tag"><FiBriefcase size={10} /> Career</div>
                <h1 className="page-title">Career Command Center</h1>
                <p className="page-desc">Let's build your personalised career plan. Answer a few questions and AI will generate your roadmap.</p>
            </motion.div>
            <CareerSetupForm onComplete={fetchProfile} userId={user.id} />
        </div>
    );

    return (
        <div className="page-shell">
            <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
                <div className="page-tag"><FiBriefcase size={10} /> Career</div>
                <h1 className="page-title">Career Command Center</h1>
                <p className="page-desc">
                    <span style={{ color: '#7c3aed', fontWeight: 700 }}>{profile.current_position}</span> → <span style={{ color: '#00f5ff', fontWeight: 700 }}>{profile.target_role}</span>
                </p>
            </motion.div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 22, overflowX: 'auto', paddingBottom: 4 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap', border: tab === t.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent', background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#f0f0ff' : 'var(--text-3)', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    {tab === 'roadmap' && <CareerRoadmap profile={profile} />}
                    {tab === 'skills' && <SkillTracker profile={profile} />}
                    {tab === 'jobs' && <JobTracker userId={user.id} />}
                    {tab === 'resume' && <ResumeBuilder profile={profile} />}
                    {tab === 'interview' && <InterviewPrep profile={profile} />}
                    {tab === 'ai' && <AICareerCoach profile={profile} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  CAREER SETUP FORM                                      */
/* ═══════════════════════════════════════════════════════ */
function CareerSetupForm({ onComplete, userId }) {
    const [form, setForm] = useState({ currentPosition: '', targetRole: '', industry: '', timeline: '12 months' });
    const [currentSkills, setCurrentSkills] = useState([]);
    const [targetSkills, setTargetSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [targetInput, setTargetInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const addSkill = (list, setList, inputVal, setInput) => {
        const v = inputVal.trim();
        if (v && !list.includes(v)) setList(l => [...l, v]);
        setInput('');
    };

    const submit = async () => {
        if (!form.currentPosition || !form.targetRole || !form.industry) {
            setError('Please fill in Current Role, Target Role, and Industry.');
            return;
        }
        setGenerating(true); setError('');
        const { data: aiData, error: aiErr } = await generateCareerRoadmap({ currentRole: form.currentPosition, targetRole: form.targetRole, industry: form.industry, timeline: form.timeline, currentSkills, targetSkills });
        if (aiErr) { setError(aiErr); setGenerating(false); return; }

        const { error: dbErr } = await supabase.from('career_profiles').insert({
            user_id: userId,
            current_position: form.currentPosition,
            target_role: form.targetRole,
            industry: form.industry,
            timeline: form.timeline,
            current_skills: currentSkills, target_skills: targetSkills,
            ai_summary: aiData.summary, ai_quick_win: aiData.quickWin, skill_gaps: aiData.skillGaps,
        });
        if (dbErr) { setError('Could not save. Try again.'); setGenerating(false); return; }

        // Save milestones
        const { data: cp } = await supabase.from('career_profiles').select('id').eq('user_id', userId).single();
        if (cp && aiData.milestones?.length) {
            await supabase.from('career_milestones').insert(
                aiData.milestones.map((m, i) => ({ user_id: userId, title: m.title, deadline: m.deadline, description: m.description, color: m.color, status: i === 0 ? 'active' : 'upcoming' }))
            );
        }
        setGenerating(false);
        onComplete();
    };

    const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

    return (
        <motion.div {...fadeUp(0.05)} style={{ maxWidth: 640, margin: '0 auto' }}>
            <Card style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(0,245,255,0.02))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🎯</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>Set Up Your Career Profile</h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>AI will generate your personalised roadmap, skill gap analysis, and milestone plan.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {[['Current Role / Level', 'currentPosition', 'e.g. Mid-level Software Engineer'],
                    ['Target Role', 'targetRole', 'e.g. Staff Engineer'],
                    ['Industry', 'industry', 'e.g. Tech / SaaS'],
                    ['Timeline', 'timeline', '12 months']].map(([label, key, ph]) => (
                        <div key={key}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
                            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} style={inputStyle} />
                        </div>
                    ))}
                </div>

                {/* Tag inputs */}
                {[['Current Skills', currentSkills, setCurrentSkills, skillInput, setSkillInput],
                ['Skills to Learn', targetSkills, setTargetSkills, targetInput, setTargetInput]].map(([label, list, setList, inp, setInp]) => (
                    <div key={label} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            {list.map((s, i) => (
                                <span key={i} style={{ padding: '4px 10px', borderRadius: 100, background: `${TAG_COLORS[i % TAG_COLORS.length]}18`, border: `1px solid ${TAG_COLORS[i % TAG_COLORS.length]}30`, color: TAG_COLORS[i % TAG_COLORS.length], fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {s} <button onClick={() => setList(l => l.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill(list, setList, inp, setInp)} placeholder="Type skill and press Enter..." style={{ ...inputStyle, flex: 1 }} />
                            <button onClick={() => addSkill(list, setList, inp, setInp)} style={{ padding: '11px 16px', borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#f0f0ff', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Add</button>
                        </div>
                    </div>
                ))}

                {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{error}</p>}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submit} disabled={generating}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: generating ? 0.8 : 1 }}>
                    {generating ? <><Spinner /> Generating your roadmap...</> : <><FiZap /> Generate AI Career Roadmap</>}
                </motion.button>
            </Card>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  CAREER ROADMAP                                         */
/* ═══════════════════════════════════════════════════════ */
function CareerRoadmap({ profile }) {
    const { user } = useAuth();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMilestones = useCallback(() => {
        (async () => {
            const { data } = await supabase.from('career_milestones').select('*').eq('user_id', user.id).order('created_at');
            setMilestones(data || []);
            setLoading(false);
        })();
    }, [user]);

    useEffect(() => { fetchMilestones(); }, [fetchMilestones]);
    useRealtimeRefresh('career_milestones', user.id, fetchMilestones);

    const toggleStatus = async (m) => {
        const newStatus = m.status === 'done' ? 'active' : m.status === 'active' ? 'done' : 'active';
        await supabase.from('career_milestones').update({ status: newStatus }).eq('id', m.id);
        setMilestones(ms => ms.map(x => x.id === m.id ? { ...x, status: newStatus } : x));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;
    if (!milestones.length) return <EmptyState icon="🗺️" title="No milestones yet" desc="Your AI roadmap is being set up." />;

    return (
        <div>
            {profile.ai_summary && (
                <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(0,245,255,0.05))', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your Career Vision</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.5 }}>{profile.ai_summary}</div>
                    {profile.ai_quick_win && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 13, color: '#10b981' }}>⚡ Quick Win: {profile.ai_quick_win}</div>}
                </Card>
            )}

            <div style={{ position: 'relative', paddingLeft: 32 }}>
                <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
                {milestones.map((m, i) => (
                    <motion.div key={m.id} {...fadeUp(i * 0.06)} style={{ marginBottom: 18, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -26, top: 18, width: 14, height: 14, borderRadius: '50%', background: m.status === 'active' ? m.color : m.status === 'done' ? '#10b981' : 'rgba(255,255,255,0.1)', border: `3px solid ${m.status === 'active' ? m.color : m.status === 'done' ? '#10b981' : 'rgba(255,255,255,0.15)'}`, boxShadow: m.status === 'active' ? `0 0 12px ${m.color}50` : 'none', zIndex: 1, cursor: 'pointer' }} onClick={() => toggleStatus(m)} />
                        <Card style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: m.status === 'done' ? 'var(--text-3)' : 'var(--text-1)', textDecoration: m.status === 'done' ? 'line-through' : 'none', marginBottom: 4 }}>{m.title}</div>
                                    {m.description && <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{m.description}</div>}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {m.deadline && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={10} />{m.deadline}</span>}
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: m.status === 'done' ? 'rgba(16,185,129,0.1)' : m.status === 'active' ? `${m.color}20` : 'rgba(255,255,255,0.05)', color: m.status === 'done' ? '#10b981' : m.status === 'active' ? m.color : 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>{m.status}</span>
                                    </div>
                                </div>
                                {m.status === 'done' && <FiCheck size={18} color="#10b981" />}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {profile.skill_gaps?.length > 0 && (
                <Card style={{ marginTop: 20, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠️ Skill Gaps to Address</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {profile.skill_gaps.map((g, i) => <span key={i} style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600 }}>{g}</span>)}
                    </div>
                </Card>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  SKILL TRACKER (Derived from career profile)            */
/* ═══════════════════════════════════════════════════════ */
function SkillTracker({ profile }) {
    const currentSkills = profile.current_skills || [];
    const targetSkills = profile.target_skills || [];
    const skillGaps = profile.skill_gaps || [];

    if (!currentSkills.length && !targetSkills.length) return (
        <EmptyState icon="📊" title="No skills tracked yet" desc="Go back to Career Roadmap to update your profile." />
    );

    const COLORS = ['#7c3aed', '#00f5ff', '#10b981', '#f59e0b', '#ec4899', '#f97316'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✅ Current Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {currentSkills.map((s, i) => <span key={i} style={{ padding: '6px 14px', borderRadius: 100, background: `${COLORS[i % COLORS.length]}18`, border: `1px solid ${COLORS[i % COLORS.length]}30`, color: COLORS[i % COLORS.length], fontSize: 13, fontWeight: 600 }}>{s}</span>)}
                </div>
            </Card>
            <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎯 Skills to Build</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {targetSkills.map((s, i) => <span key={i} style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}>{s}</span>)}
                </div>
                {skillGaps.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase' }}>⚠️ AI-Identified Gaps</div>
                        {skillGaps.map((g, i) => <div key={i} style={{ fontSize: 13, color: '#f87171', padding: '4px 0', borderBottom: i < skillGaps.length - 1 ? '1px solid rgba(239,68,68,0.08)' : 'none' }}>• {g}</div>)}
                    </div>
                )}
            </Card>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  JOB TRACKER                                            */
/* ═══════════════════════════════════════════════════════ */
function JobTracker({ userId }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ company: '', role: '', salary: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const stages = ['Applied', 'Screening', 'Interview', 'Offer'];

    const fetchJobs = useCallback(() => {
        (async () => {
            const { data } = await supabase.from('job_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            setJobs(data || []);
            setLoading(false);
        })();
    }, [userId]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);
    useRealtimeRefresh('job_applications', userId, fetchJobs);

    const addJob = async () => {
        if (!form.company.trim() || !form.role.trim()) return;
        setSaving(true);
        const { data, error } = await supabase.from('job_applications').insert({ user_id: userId, company: form.company, job_role: form.role, salary: form.salary, notes: form.notes, status: 'Applied', color: '#7c3aed' }).select().single();
        if (!error && data) setJobs(j => [data, ...j]);
        setForm({ company: '', role: '', salary: '', notes: '' }); setAdding(false); setSaving(false);
    };

    const moveJob = async (id, newStatus) => {
        await supabase.from('job_applications').update({ status: newStatus }).eq('id', id);
        setJobs(js => js.map(j => j.id === id ? { ...j, status: newStatus } : j));
    };

    const delJob = async (id) => {
        await supabase.from('job_applications').delete().eq('id', id);
        setJobs(js => js.filter(j => j.id !== id));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    return (
        <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {stages.map(s => {
                    const count = jobs.filter(j => j.status === s).length;
                    return <div key={s} style={{ flex: 1, padding: '12px', borderRadius: 12, background: `${statusColors[s]}12`, border: `1px solid ${statusColors[s]}30`, textAlign: 'center' }}><div style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, fontWeight: 900, color: statusColors[s] }}>{count}</div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s}</div></div>;
                })}
            </div>

            <div style={{ marginBottom: 16 }}>
                {!adding ? (
                    <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(0,245,255,0.08))', border: '1px solid rgba(124,58,237,0.3)', color: '#f0f0ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        <FiPlus size={13} /> Add Application
                    </button>
                ) : (
                    <Card style={{ padding: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            {[['Company', 'company'], ['Role', 'role'], ['Salary', 'salary'], ['Notes', 'notes']].map(([label, key]) => (
                                <input key={key} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={label}
                                    style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={addJob} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{saving ? '...' : 'Add'}</button>
                            <button onClick={() => setAdding(false)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-3)', cursor: 'pointer' }}><FiX size={12} /></button>
                        </div>
                    </Card>
                )}
            </div>

            {!jobs.length ? <EmptyState icon="📋" title="No applications yet" desc="Track your job applications here." cta="Add Your First Application" onCta={() => setAdding(true)} /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {jobs.map(j => (
                        <motion.div key={j.id} layout>
                            <Card style={{ padding: '14px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${j.color || '#7c3aed'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: j.color || '#7c3aed' }}>{j.company?.charAt(0)}</div>
                                            <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{j.company}</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>{j.job_role}</div></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: `${statusColors[j.status]}20`, color: statusColors[j.status], fontWeight: 700 }}>{j.status}</span>
                                            {j.salary && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>{j.salary}</span>}
                                        </div>
                                        {j.notes && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, fontStyle: 'italic' }}>📝 {j.notes}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                        {stages.filter(s => s !== j.status).slice(0, 2).map(s => (
                                            <button key={s} onClick={() => moveJob(j.id, s)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: `${statusColors[s]}15`, border: `1px solid ${statusColors[s]}30`, color: statusColors[s], fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{s}</button>
                                        ))}
                                        <button onClick={() => delJob(j.id)} style={{ padding: '4px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}><FiTrash2 size={10} /></button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  RESUME BUILDER (AI-Generated from profile)             */
/* ═══════════════════════════════════════════════════════ */
function ResumeBuilder({ profile }) {
    const { user } = useAuth();
    const [sections, setSections] = useState([]);
    const [editing, setEditing] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [savedResumes, setSavedResumes] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);

    const fetchResumes = useCallback(async () => {
        const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('last_edited', { ascending: false });
        setSavedResumes(data || []);
        if (data?.length > 0 && !activeResumeId) {
            setSections(data[0].content_json);
            setActiveResumeId(data[0].id);
            setGenerated(true);
        }
    }, [user.id, activeResumeId]);

    useEffect(() => { fetchResumes(); }, [fetchResumes]);
    useRealtimeRefresh('resumes', user.id, fetchResumes);

    const generate = async () => {
        setGenerating(true);
        const prompt = `Create a professional resume template with the following sections for someone going from ${profile.current_position} to ${profile.target_role} in ${profile.industry}. Return 4 resume sections as JSON array: [{ "id": "section_id", "title": "emoji Section Title", "content": "placeholder content with [[BRACKETS]] for user to fill" }]. Include: Professional Summary, Experience, Technical Skills, Education.`;
        const { text } = await callGemini(prompt);
        try {
            const clean = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);
            setSections(parsed);

            // Auto-save initial version
            const { data } = await supabase.from('resumes').insert({
                user_id: user.id,
                title: `Resume - ${profile.target_role}`,
                content_json: parsed,
                template_id: 'modern'
            }).select().single();

            if (data) {
                setActiveResumeId(data.id);
                setSavedResumes(prev => [data, ...prev]);
            }
            setGenerated(true);
        } catch {
            const fallback = [
                { id: 'summary', title: '📋 Professional Summary', content: `Experienced ${profile.current_position} targeting ${profile.target_role} in ${profile.industry}. Skilled in ${profile.current_skills?.join(', ')}.` },
                { id: 'experience', title: '💼 Experience', content: '[[Add your work experience here]]' },
                { id: 'skills', title: '🛠️ Technical Skills', content: profile.current_skills?.join(' · ') || '[[Add your skills]]' },
                { id: 'education', title: '🎓 Education', content: '[[Add your education]]' },
            ];
            setSections(fallback);
            setGenerated(true);
        }
        setGenerating(false);
    };

    const saveChanges = async () => {
        if (!activeResumeId) return;
        setSaving(true);
        await supabase.from('resumes').update({
            content_json: sections,
            last_edited: new Date().toISOString()
        }).eq('id', activeResumeId);
        setSaving(false);
    };

    const enhanceSection = async (secId) => {
        const sec = sections.find(s => s.id === secId);
        const prompt = `Enhance this resume section for a ${profile.current_position} aiming for ${profile.target_role}:\n\n${sec.title}\n${sec.content}\n\nMake it ATS-optimized, use strong action verbs, quantify achievements where possible. Return only the enhanced content, no title.`;
        const { text } = await callGemini(prompt, SYSTEM_PROMPTS.career);
        setSections(ss => ss.map(s => s.id === secId ? { ...s, content: text } : s));
    };

    if (!generated) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Generate Your Resume Template</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>AI will create a personalised resume framework based on your career profile.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={generate} disabled={generating}
                style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {generating ? <><Spinner /> Generating...</> : <><FiZap /> Generate Resume Template</>}
            </motion.button>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✍️ Editor</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {savedResumes.length > 0 && (
                            <select
                                value={activeResumeId || ''}
                                onChange={(e) => {
                                    const res = savedResumes.find(r => r.id === e.target.value);
                                    if (res) {
                                        setActiveResumeId(res.id);
                                        setSections(res.content_json);
                                    }
                                }}
                                className="app-select"
                                style={{ fontSize: 11, padding: '4px 8px' }}
                            >
                                {savedResumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                            </select>
                        )}
                        <button onClick={saveChanges} disabled={saving} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => window.print()} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiDownload size={10} /> PDF
                        </button>
                    </div>
                </div>

                {/* Print styles */}
                <style>{`
                    @media print {
                        body * { visibility: hidden; background: white !important; }
                        .resume-preview-section, .resume-preview-section * { visibility: visible; }
                        .resume-preview-section { 
                            position: fixed; left: 0; top: 0; width: 100% !important; height: auto !important; 
                            max-height: none !important; border: none !important; padding: 40px !important;
                            background: white !important; color: black !important;
                        }
                        .resume-preview-section pre { color: #333 !important; font-size: 11pt !important; line-height: 1.5 !important; }
                        .resume-preview-section div { color: #000 !important; }
                        .sidebar, .top-bar, .app-bg-canvas, .no-print { display: none !important; }
                    }
                `}</style>
                {sections.map(sec => (
                    <Card key={sec.id} style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{sec.title}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => enhanceSection(sec.id)} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(0,245,255,0.1))', border: '1px solid rgba(124,58,237,0.3)', color: '#00f5ff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}><FiZap size={10} /> AI Enhance</button>
                                <button onClick={() => setEditing(editing === sec.id ? null : sec.id)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-3)', cursor: 'pointer' }}><FiEdit3 size={10} /></button>
                            </div>
                        </div>
                        {editing === sec.id ? (
                            <textarea value={sec.content} onChange={e => setSections(ss => ss.map(s => s.id === sec.id ? { ...s, content: e.target.value } : s))} rows={6} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--app-border)', borderRadius: 8, padding: '10px', color: 'var(--text-1)', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.7, resize: 'vertical', outline: 'none' }} />
                        ) : (
                            <pre style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>{sec.content}</pre>
                        )}
                    </Card>
                ))}
            </div>
            <Card className="resume-preview-section" style={{ background: '#0e0e28', border: '1px solid rgba(124,58,237,0.2)', position: 'sticky', top: 20, alignSelf: 'start', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Live Preview</div>
                <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f0ff' }}>{profile.target_role}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{profile.industry}</div>
                </div>
                {sections.map(sec => (
                    <div key={sec.id} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid rgba(124,58,237,0.2)', paddingBottom: 3 }}>{sec.title.replace(/^.{2}\s/, '')}</div>
                        <pre style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>{sec.content}</pre>
                    </div>
                ))}
            </Card>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  INTERVIEW PREP (AI questions from target role)         */
/* ═══════════════════════════════════════════════════════ */
function InterviewPrep({ profile }) {
    const [questions, setQuestions] = useState([]);
    const [selectedQ, setSelectedQ] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState('All');

    const loadQuestions = async () => {
        setGenerating(true);
        const { data, error } = await generateInterviewQuestions(profile.target_role);
        if (!error && data) setQuestions(data);
        setGenerating(false);
    };

    const getAIFeedback = async () => {
        if (!userAnswer.trim() || selectedQ === null) return;
        setLoading(true); setFeedback('');
        const q = questions[selectedQ];
        const { text, error } = await callGemini(
            `Interview question (${q.category}, ${q.difficulty}): "${q.q}"\n\nCandidate's answer: "${userAnswer}"\n\nEvaluate and provide: 1) Score /10 2) Strengths 3) Improvements 4) Model answer. Use emojis. Under 250 words.`,
            SYSTEM_PROMPTS.career
        );
        if (!error && text) {
            setFeedback(text);
            await supabase.from('ai_history').insert({
                user_id: profile.user_id,
                module: 'career',
                prompt: `Interview Feedback: ${q.q}`,
                response: text
            });
        } else {
            setFeedback(error ? `⚠️ ${error}` : '');
        }
        setLoading(false);
    };

    const cats = ['All', ...new Set(questions.map(q => q.category))];
    const filtered = filter === 'All' ? questions : questions.filter(q => q.category === filter);

    if (!questions.length) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🎤</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Generate Interview Questions</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>AI will create relevant questions for a <strong>{profile.target_role}</strong> role.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={loadQuestions} disabled={generating}
                style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {generating ? <><Spinner /> Generating questions...</> : <><FiZap /> Generate Questions</>}
            </motion.button>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
            <div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
                    {cats.map(c => (
                        <button key={c} onClick={() => setFilter(c)}
                            style={{ fontSize: 10, padding: '4px 10px', borderRadius: 100, background: filter === c ? 'rgba(124,58,237,0.15)' : 'transparent', border: filter === c ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', color: filter === c ? '#f0f0ff' : 'var(--text-3)', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{c}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map((q, i) => {
                        const origIdx = questions.indexOf(q);
                        return (
                            <motion.div key={origIdx} whileHover={{ x: 3 }} onClick={() => { setSelectedQ(origIdx); setFeedback(''); setUserAnswer(''); }}
                                style={{ padding: '14px', borderRadius: 12, background: selectedQ === origIdx ? 'rgba(124,58,237,0.12)' : 'var(--app-surface)', border: selectedQ === origIdx ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--app-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>{q.q}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: `${catColors[q.category] || '#7c3aed'}18`, color: catColors[q.category] || '#7c3aed', fontWeight: 700 }}>{q.category}</span>
                                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: `${diffColors[q.difficulty] || '#f59e0b'}18`, color: diffColors[q.difficulty] || '#f59e0b', fontWeight: 700 }}>{q.difficulty}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            <Card>
                {selectedQ !== null ? (
                    <div>
                        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: '#00f5ff', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interview Question</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{questions[selectedQ]?.q}</div>
                        </div>
                        <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="Type your answer here..." rows={6}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', lineHeight: 1.7, resize: 'vertical', outline: 'none', marginBottom: 14 }} />
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={getAIFeedback} disabled={loading || !userAnswer.trim()}
                            style={{ padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 7, opacity: loading || !userAnswer.trim() ? 0.5 : 1 }}>
                            {loading ? <><Spinner /> Analysing...</> : <><FiZap /> Get AI Feedback</>}
                        </motion.button>
                        {feedback && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 18, padding: '16px 20px', borderRadius: 14, background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#00f5ff', textTransform: 'uppercase', marginBottom: 10 }}>🤖 AI Feedback</div>
                            <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{feedback}</div>
                        </motion.div>}
                    </div>
                ) : <EmptyState icon="🎤" title="Select a question to practice" desc="Get instant AI feedback on your answers" />}
            </Card>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════ */
/*  AI CAREER COACH                                        */
/* ═══════════════════════════════════════════════════════ */
function AICareerCoach({ profile }) {
    const [q, setQ] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if (!q.trim()) return;
        setLoading(true); setPlan('');
        const context = `User profile: ${profile.current_position} → ${profile.target_role} in ${profile.industry}. Timeline: ${profile.timeline}. Skills: ${profile.current_skills?.join(', ')}.`;
        const { text, error } = await callGemini(`${context}\n\nCareer question: "${q}"`, SYSTEM_PROMPTS.career);
        if (!error && text) {
            setPlan(text);
            await supabase.from('ai_history').insert({
                user_id: profile.user_id,
                module: 'career',
                prompt: q,
                response: text
            });
        } else {
            setPlan(error ? `⚠️ ${error}` : '');
        }
        setLoading(false);
    };

    const prompts = ['How do I negotiate a 30% salary increase?', `Create a 90-day plan to become a ${profile.target_role}`, 'Should I join a startup or stay at a big company?', 'How do I build a personal brand as an engineer?'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(0,245,255,0.04))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>💼</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>AI Career Strategist</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>Personalised career advice powered by your profile — {profile.current_role} → {profile.target_role}.</p>
                <textarea value={q} onChange={e => setQ(e.target.value)} placeholder="What career challenge are you facing?" rows={4}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)', borderRadius: 12, padding: '12px', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', lineHeight: 1.7, resize: 'vertical', outline: 'none', marginBottom: 14 }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate} disabled={loading || !q.trim()}
                    style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: q.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, opacity: loading || !q.trim() ? 0.6 : 1 }}>
                    {loading ? <><Spinner /> Thinking...</> : <><FiZap /> Get Strategy</>}
                </motion.button>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Popular questions:</span>
                    {prompts.map((p, i) => <button key={i} onClick={() => setQ(p)} style={{ textAlign: 'left', padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>💡 {p}</button>)}
                </div>
            </Card>
            <Card style={{ overflowY: 'auto', maxHeight: 600 }}>
                {plan ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🤖</div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Career Strategy</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{plan}</div>
                    </motion.div>
                ) : <EmptyState icon="🗺️" title="Your strategy will appear here" desc="Ask anything about your career path." />}
            </Card>
        </div>
    );
}
