import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import ParticleCanvas from '../components/ParticleCanvas';
import '../App.css';

const passwordRules = [
    { test: (p) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p) => /[0-9]/.test(p), label: 'One number' },
];

export default function Signup() {
    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        const { error: err } = await signUp(form.email, form.password, form.fullName);
        setLoading(false);
        if (err) { setError(err.message); return; }
        setSuccess(true);
    };

    const handleGoogle = async () => {
        setLoading(true);
        await signInWithGoogle();
        setLoading(false);
    };

    if (success) return (
        <div className="auth-page">
            <ParticleCanvas count={50} networking={true} color="#10b981" accent="#00e5ff" speed={0.4} opacity={0.7} />
            <motion.div className="auth-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -5, 0] }}
                    transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut' }}
                    style={{ fontSize: 72, marginBottom: 24, display: 'inline-block', filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.5))' }}
                >
                    🎉
                </motion.div>
                <h2 className="auth-title">You're In!</h2>
                <p className="auth-subtitle">Check your email to confirm your account, then sign in to start growing.</p>
                <Link to="/login" style={{ display: 'block', marginTop: 28 }}>
                    <motion.div whileHover={{ scale: 1.03, y: -2 }} className="btn-auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        Go to Sign In →
                    </motion.div>
                </Link>
            </motion.div>
        </div>
    );

    const strength = passwordRules.filter(r => r.test(form.password)).length;
    const strengthColors = ['#ef4444', '#f59e0b', '#10b981'];
    const strengthLabels = ['Weak', 'Medium', 'Strong'];

    return (
        <div className="auth-page">
            {/* ── PARTICLES ── */}
            <ParticleCanvas
                count={65}
                networking={true}
                color="#e879f9"
                accent="#7c3aed"
                speed={0.5}
                maxDist={120}
                size={1.6}
                opacity={0.8}
            />

            {/* ── GLOW ORBS ── */}
            <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.08, 0.15, 0.08] }}
                transition={{ duration: 9, repeat: Infinity }}
                style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: '#e879f9', filter: 'blur(110px)', top: '-15%', right: '-15%', pointerEvents: 'none' }}
            />
            <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.16, 0.1] }}
                transition={{ duration: 11, repeat: Infinity, delay: 4 }}
                style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#7c3aed', filter: 'blur(100px)', bottom: '-10%', left: '-10%', pointerEvents: 'none' }}
            />

            {/* ── CARD ── */}
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="auth-logo">
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #00e5ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 28px rgba(124,58,237,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
                        position: 'relative', overflow: 'hidden', flexShrink: 0,
                    }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', position: 'relative', zIndex: 1 }}>PX</span>
                    </div>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 19, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1 }}>
                        <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #f0f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PriMaX</span><span style={{ color: '#00e5ff' }}> Hub</span>
                    </span>
                </div>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join 50,000+ growth pioneers — it's free to start</p>

                <button className="btn-google" onClick={handleGoogle} disabled={loading}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                </button>

                <div className="divider">or register with email</div>

                <AnimatePresence>
                    {error && (
                        <motion.div className="form-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', marginBottom: 16 }}>
                            <FiAlertCircle size={14} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full name</label>
                        <div style={{ position: 'relative' }}>
                            <FiUser size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                            <input className="form-input" name="fullName" type="text" placeholder="Alex Rivera" value={form.fullName} onChange={handleChange} style={{ paddingLeft: 44 }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <div style={{ position: 'relative' }}>
                            <FiMail size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                            <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} style={{ paddingLeft: 44 }} autoComplete="email" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                            <input className="form-input" name="password" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={handleChange} style={{ paddingLeft: 44, paddingRight: 46 }} autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#44446a', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>

                        {/* Password strength */}
                        <AnimatePresence>
                            {form.password && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, overflow: 'hidden' }}>
                                    {/* Strength bar */}
                                    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i} animate={{ background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.06)' }}
                                                transition={{ duration: 0.3 }}
                                                style={{ flex: 1, height: 4, borderRadius: 2 }} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 11, color: strengthColors[strength - 1] || '#44446a', fontWeight: 700, marginBottom: 8 }}>
                                        {strength > 0 ? strengthLabels[strength - 1] : 'Too short'}
                                    </div>
                                    {passwordRules.map((r, i) => (
                                        <motion.div key={i} animate={{ color: r.test(form.password) ? '#10b981' : '#44446a' }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, marginBottom: 4 }}>
                                            <motion.span animate={{ scale: r.test(form.password) ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                                                <FiCheck size={12} />
                                            </motion.span>
                                            {r.label}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        className="btn-auth"
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                                Creating account...
                            </span>
                        ) : "Create Account — It's Free"}
                    </motion.button>
                </form>

                <p style={{ fontSize: 12, color: '#44446a', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                    By signing up you agree to our <a href="#" style={{ color: '#00e5ff' }}>Terms</a> and <a href="#" style={{ color: '#00e5ff' }}>Privacy Policy</a>.
                </p>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
