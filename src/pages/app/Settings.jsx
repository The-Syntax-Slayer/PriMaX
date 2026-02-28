import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSettings, FiUser, FiBell, FiShield, FiMonitor, FiSave,
    FiCheck, FiDownload, FiTrash2, FiLock, FiAlertTriangle, FiX,
    FiMail, FiGlobe, FiCamera, FiEdit3
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const TABS = [
    { id: 'profile', label: 'Profile', icon: <FiUser size={14} /> },
    { id: 'appearance', label: 'Appearance', icon: <FiMonitor size={14} /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell size={14} /> },
    { id: 'security', label: 'Security', icon: <FiShield size={14} /> },
    { id: 'data', label: 'Data & Privacy', icon: <FiDownload size={14} /> },
];

const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--app-border)',
    color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
};

function StatusPill({ type, msg }) {
    const colors = { success: '#10b981', error: '#f87171' };
    return (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: `${colors[type]}10`, border: `1px solid ${colors[type]}30`, fontSize: 13, color: colors[type], marginBottom: 16 }}>
            {type === 'success' ? <FiCheck size={13} /> : <FiX size={13} />} {msg}
        </motion.div>
    );
}

export default function Settings() {
    const { user, refreshProfile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="page-shell">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 24 }}>
                <div className="page-tag"><FiSettings size={10} /> Settings</div>
                <h1 className="page-title">Settings</h1>
                <p className="page-desc">Manage your account, appearance, notifications, and data.</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 22, alignItems: 'start' }}>
                {/* Sidebar */}
                <div style={{ borderRadius: 18, background: 'var(--app-surface)', border: '1px solid var(--app-border)', padding: 14 }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, width: '100%', marginBottom: 4, background: activeTab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent', border: activeTab === t.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent', color: activeTab === t.id ? '#f0f0ff' : 'var(--text-2)', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                    <div style={{ borderTop: '1px solid var(--app-border)', marginTop: 8, paddingTop: 8 }}>
                        <button onClick={signOut}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, width: '100%', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            <FiX size={14} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                        style={{ borderRadius: 18, background: 'var(--app-surface)', border: '1px solid var(--app-border)', padding: 28 }}>
                        {activeTab === 'profile' && <ProfileTab user={user} refreshProfile={refreshProfile} />}
                        {activeTab === 'appearance' && <AppearanceTab />}
                        {activeTab === 'notifications' && <NotificationsTab />}
                        {activeTab === 'security' && <SecurityTab user={user} />}
                        {activeTab === 'data' && <DataTab user={user} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ── Profile Tab ─────────────────────────────────── */
function ProfileTab({ user, refreshProfile }) {
    const [form, setForm] = useState({ full_name: '', primary_goal: '', bio: '', avatar_url: '', focus_areas: [] });
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const FOCUS = ['Career', 'Finance', 'Fitness', 'Mental Growth', 'Productivity'];

    useEffect(() => {
        if (!user) return;
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
            .then(({ data }) => {
                if (data) setForm({
                    full_name: data.full_name || '',
                    primary_goal: data.primary_goal || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || '',
                    focus_areas: data.focus_areas || []
                });
            });
    }, [user]);

    const uploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setStatus(null);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setForm(f => ({ ...f, avatar_url: publicUrl }));
            setStatus({ type: 'success', msg: 'Avatar uploaded! Click "Save Profile" below to confirm.' });
        } catch (err) {
            if (err.message?.includes('not found') || err.status === 404 || err.status === '404') {
                setStatus({
                    type: 'error',
                    msg: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>⚠️ <b>Storage Bucket "avatars" not found.</b></div>
                            <div style={{ fontSize: 12 }}>Please create a <b>Public</b> bucket named <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>avatars</code> in your Supabase Dashboard.</div>
                            <button
                                onClick={() => navigator.clipboard.writeText('avatars')}
                                style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-2)', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                            >
                                Copy Bucket Name
                            </button>
                        </div>
                    )
                });
            } else {
                setStatus({ type: 'error', msg: 'Upload failed: ' + err.message });
            }
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        setSaving(true); setStatus(null);
        const { error } = await supabase.from('profiles').upsert({ id: user.id, ...form, updated_at: new Date().toISOString() });

        if (error) {
            if (error.message.includes('column') && error.message.includes('not found')) {
                setStatus({
                    type: 'error',
                    msg: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ color: '#f87171', fontWeight: 800 }}>⚠️ DATABASE SCHEMA OUT OF SYNC</div>
                            <div style={{ fontSize: 12, lineHeight: 1.5 }}>The profile columns (bio, primary_goal, focus_areas) are missing from your Supabase table. Please run this SQL in your <b>Supabase SQL Editor</b>:</div>
                            <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: 8, fontSize: 11, overflowX: 'auto', border: '1px solid rgba(248,113,113,0.3)', color: '#eee', fontFamily: 'JetBrains Mono, monospace' }}>
                                {`ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS primary_goal text,
ADD COLUMN IF NOT EXISTS focus_areas text[];`}
                            </pre>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS primary_goal text, ADD COLUMN IF NOT EXISTS focus_areas text[];`)}
                                    style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)' }}
                                >
                                    Copy SQL Command
                                </button>
                                <button
                                    onClick={() => window.open('https://supabase.com/dashboard/project/_/sql/new', '_blank')}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-2)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Open Supabase SQL Editor
                                </button>
                            </div>
                        </div>
                    )
                });
            } else {
                setStatus({ type: 'error', msg: error.message });
            }
        } else {
            await supabase.auth.updateUser({ data: { full_name: form.full_name, avatar_url: form.avatar_url } });
            if (refreshProfile) refreshProfile();
            setStatus({ type: 'success', msg: 'Profile saved successfully.' });
        }
        setSaving(false);
    };

    const toggleFocus = (area) => {
        setForm(f => ({
            ...f,
            focus_areas: f.focus_areas.includes(area)
                ? f.focus_areas.filter(a => a !== area)
                : [...f.focus_areas, area],
        }));
    };

    return (
        <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Profile</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>Your personal information and growth preferences.</p>
            {status && <StatusPill type={status.type} msg={status.msg} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '20px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--app-border)' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: 'white', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(124,58,237,0.3)' }}>
                        {form.avatar_url ? (
                            <img src={form.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (form.full_name || user?.email || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <label style={{ position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: '50%', background: 'var(--app-surface-solid)', border: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00f5ff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        <FiCamera size={14} />
                        <input type="file" onChange={uploadAvatar} style={{ display: 'none' }} accept="image/*" disabled={uploading} />
                    </label>
                </div>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{form.full_name || 'Your Name'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><FiMail size={11} /> {user?.email}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Name</label>
                    <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" style={inputStyle} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Primary Goal</label>
                    <input value={form.primary_goal} onChange={e => setForm(f => ({ ...f, primary_goal: e.target.value }))} placeholder="e.g. Master React and AI integration" style={inputStyle} />
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bio / Philosophy</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Focus Areas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {FOCUS.map(area => (
                        <button key={area} onClick={() => toggleFocus(area)}
                            style={{ padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', border: form.focus_areas.includes(area) ? '1px solid #7c3aed' : '1px solid var(--app-border)', background: form.focus_areas.includes(area) ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)', color: form.focus_areas.includes(area) ? '#7c3aed' : 'var(--text-3)', transition: 'all 0.2s' }}>
                            {area}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={save} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.6 : 1 }}>
                <FiSave size={14} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
        </div>
    );
}

/* ── Appearance Tab ─────────────────────────────── */
function AppearanceTab() {
    const { theme, setTheme } = useTheme();
    const [accentColor, setAccentColor] = useState(localStorage.getItem('accent') || '#7c3aed');
    const [saved, setSaved] = useState(false);

    const ACCENTS = [
        { name: 'Hyper Bloom', hex: '#7c3aed', rgb: '124, 58, 237' },
        { name: 'Neon Ocean', hex: '#3b82f6', rgb: '59, 130, 246' },
        { name: 'Emerald City', hex: '#10b981', rgb: '16, 185, 129' },
        { name: 'Cyber Amber', hex: '#f59e0b', rgb: '245, 158, 11' },
        { name: 'Future Pink', hex: '#ec4899', rgb: '236, 72, 153' },
        { name: 'Solar Flare', hex: '#f97316', rgb: '249, 115, 22' },
    ];

    const save = (colorObj) => {
        const c = colorObj || ACCENTS.find(a => a.hex === accentColor);
        localStorage.setItem('accent', c.hex);
        localStorage.setItem('accent_rgb', c.rgb);
        document.documentElement.style.setProperty('--accent', c.hex);
        document.documentElement.style.setProperty('--accent-rgb', c.rgb);
        setAccentColor(c.hex);
        setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Appearance</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>Customise how PriMaX Hub looks and feels.</p>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Base Theme</label>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[
                        { id: 'dark', label: '🌙 Midnight', active: theme === 'dark' },
                        { id: 'light', label: '☀️ Daybreak', active: theme === 'light' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id)}
                            style={{ padding: '12px 24px', borderRadius: 12, background: t.active ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)', border: t.active ? '1px solid #7c3aed' : '1px solid var(--app-border)', color: t.active ? 'var(--text-1)' : 'var(--text-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accent Atmosphere</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {ACCENTS.map(c => (
                        <button key={c.hex} onClick={() => save(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, background: accentColor === c.hex ? 'rgba(255,255,255,0.05)' : 'transparent', border: accentColor === c.hex ? `1px solid ${c.hex}` : '1px solid var(--app-border)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex, boxShadow: `0 0 10px ${c.hex}50` }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: accentColor === c.hex ? 'var(--text-1)' : 'var(--text-3)' }}>{c.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                💡 Choice of theme and accent atmosphere is instantly applied across all modules of the platform.
            </div>
        </div>
    );
}

/* ── Notifications Tab ────────────────────────────── */
function NotificationsTab() {
    const [prefs, setPrefs] = useState({
        daily_reminder: true, habit_nudge: true, goal_milestone: true,
        ai_insights: true, weekly_report: false, streak_alert: true,
    });
    const [saved, setSaved] = useState(false);

    const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));
    const save = () => {
        localStorage.setItem('notif_prefs', JSON.stringify(prefs));
        setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    const items = [
        { key: 'daily_reminder', label: 'Daily Check-in Reminder', desc: 'Remind me to log my day each evening' },
        { key: 'habit_nudge', label: 'Habit Nudges', desc: 'Alert me if I haven\'t completed habits by midday' },
        { key: 'goal_milestone', label: 'Goal Milestones', desc: 'Notify when I reach a savings or career milestone' },
        { key: 'ai_insights', label: 'AI Insights', desc: 'Receive weekly AI-generated growth tips' },
        { key: 'streak_alert', label: 'Streak Alerts', desc: 'Warn before a habit streak is broken' },
        { key: 'weekly_report', label: 'Weekly Report', desc: 'Get a Sunday summary of the week\'s performance' },
    ];

    return (
        <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Notifications</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>Control what PriMaX Hub notifies you about.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 24 }}>
                {items.map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.desc}</div>
                        </div>
                        <button onClick={() => toggle(item.key)}
                            style={{ width: 44, height: 24, borderRadius: 12, background: prefs[item.key] ? 'linear-gradient(135deg,#7c3aed,#00f5ff)' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.3s' }}>
                            <motion.div animate={{ x: prefs[item.key] ? 20 : 2 }}
                                style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }} />
                        </button>
                    </div>
                ))}
            </div>
            <button onClick={save}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {saved ? <><FiCheck size={14} /> Saved!</> : <><FiSave size={14} /> Save Preferences</>}
            </button>
        </div>
    );
}

/* ── Security Tab ────────────────────────────────── */
function SecurityTab({ user }) {
    const [form, setForm] = useState({ new_password: '', confirm_password: '' });
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    const changePassword = async () => {
        if (!form.new_password || form.new_password.length < 8) { setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' }); return; }
        if (form.new_password !== form.confirm_password) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
        setSaving(true); setStatus(null);
        const { error } = await supabase.auth.updateUser({ password: form.new_password });
        setStatus(error ? { type: 'error', msg: error.message } : { type: 'success', msg: 'Password updated successfully.' });
        setForm({ new_password: '', confirm_password: '' });
        setSaving(false);
    };

    return (
        <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Security</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>Manage your password and account security.</p>

            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <FiMail size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Account Email</div>
                    <div style={{ fontSize: 12, color: '#10b981' }}>{user?.email}</div>
                </div>
            </div>

            {status && <StatusPill type={status.type} msg={status.msg} />}

            <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>Change Password</h3>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Password</label>
                    <input type="password" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Min. 8 characters" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm Password</label>
                    <input type="password" value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))} placeholder="Repeat new password" style={inputStyle} />
                </div>
                <button onClick={changePassword} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#00f5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.6 : 1 }}>
                    <FiLock size={14} /> {saving ? 'Updating...' : 'Update Password'}
                </button>
            </div>

            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Active Sessions</h3>
                <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--app-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Current Session</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Last sign-in: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '–'}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 100, fontWeight: 700 }}>Active</span>
                </div>
            </div>
        </div>
    );
}

/* ── Data & Privacy Tab ───────────────────────────── */
function DataTab({ user }) {
    const [exporting, setExporting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [status, setStatus] = useState(null);

    const exportData = async () => {
        setExporting(true);
        const tables = ['tasks', 'habits', 'transactions', 'savings_goals', 'workouts', 'journal_entries', 'mood_logs', 'gratitude_entries', 'career_profiles'];
        const exportObj = { exported_at: new Date().toISOString(), user_id: user.id };
        for (const tbl of tables) {
            const { data } = await supabase.from(tbl).select('*').eq('user_id', user.id);
            exportObj[tbl] = data || [];
        }
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `primax-export-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
    };

    const deleteAllData = async () => {
        if (deleteConfirm !== 'DELETE') { setStatus({ type: 'error', msg: 'Type DELETE to confirm.' }); return; }
        setDeleting(true);
        const tables = ['tasks', 'habits', 'transactions', 'savings_goals', 'workouts', 'journal_entries', 'mood_logs', 'gratitude_entries', 'career_profiles', 'career_milestones', 'job_applications', 'budgets', 'subscriptions'];
        for (const tbl of tables) { await supabase.from(tbl).delete().eq('user_id', user.id); }
        setStatus({ type: 'success', msg: 'All data deleted. Your account is now empty.' });
        setDeleteConfirm(''); setDeleting(false);
    };

    return (
        <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Data & Privacy</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>Export your data or manage your account data.</p>
            {status && <StatusPill type={status.type} msg={status.msg} />}

            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><FiDownload size={14} /> Export Your Data</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Download all your tasks, habits, transactions, workouts, journal entries and more as JSON.</p>
                <button onClick={exportData} disabled={exporting}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    <FiDownload size={13} /> {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
                </button>
            </div>

            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f87171', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><FiAlertTriangle size={14} /> Delete All Data</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Permanently delete all your personal data from PriMaX Hub. This cannot be undone. Your account remains active.</p>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Type DELETE to confirm</label>
                    <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="TYPE DELETE"
                        style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', maxWidth: 220 }} />
                </div>
                <button onClick={deleteAllData} disabled={deleting || deleteConfirm !== 'DELETE'}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: deleteConfirm === 'DELETE' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${deleteConfirm === 'DELETE' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'}`, color: deleteConfirm === 'DELETE' ? '#f87171' : 'var(--text-3)', fontSize: 13, fontWeight: 700, cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                    <FiTrash2 size={13} /> {deleting ? 'Deleting...' : 'Delete All My Data'}
                </button>
            </div>
        </div>
    );
}
