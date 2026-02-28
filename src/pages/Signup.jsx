import { useState, useEffect } from 'react';
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

    // Typewriter effect for heading
    const FULL_TEXT = 'Unlimited Growth';
    const [typed, setTyped] = useState('');
    const FORM_TITLE = 'Create account';
    const [formTyped, setFormTyped] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                setTyped(FULL_TEXT.slice(0, i + 1));
                i++;
                if (i >= FULL_TEXT.length) clearInterval(interval);
            }, 65);
            return () => clearInterval(interval);
        }, 900);

        // Form title typewriter
        let j = 0;
        const formTimer = setTimeout(() => {
            const interval = setInterval(() => {
                setFormTyped(FORM_TITLE.slice(0, j + 1));
                j++;
                if (j >= FORM_TITLE.length) clearInterval(interval);
            }, 70);
            return () => clearInterval(interval);
        }, 300);

        return () => {
            clearTimeout(timer);
            clearTimeout(formTimer);
        };
    }, []);

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
            <div className="auth-landscape-wrapper">
                {/* ── LEFT SIDE: VISUAL ── */}
                <div className="auth-visual-side">
                    {/* ── ANIMATED BACKGROUND ── */}
                    <motion.div
                        animate={{ scale: [1, 1.07, 1], x: [0, 14, 0], y: [0, -10, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', inset: '-10%',
                            backgroundImage: 'url("/futuristic_auth_visual_signup_1772303543531.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            zIndex: 0,
                        }}
                    />
                    {/* fade overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(3,3,15,0.5), #03030f)', zIndex: 1 }} />

                    <motion.div
                        className="auth-visual-content"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ position: 'relative', zIndex: 2 }}
                    >
                        {/* Logo row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #00e5ff 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 28px rgba(124,58,237,0.8)',
                            }}>
                                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 15, fontWeight: 900, color: 'white' }}>PX</span>
                            </div>
                            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>
                                PriMaX <span style={{ color: '#00e5ff' }}>Hub</span>
                            </span>
                        </div>

                        {/* ── GLASS TEXT CARD ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{
                                background: 'rgba(10, 6, 30, 0.55)',
                                backdropFilter: 'blur(18px)',
                                WebkitBackdropFilter: 'blur(18px)',
                                border: '1px solid rgba(232, 121, 249, 0.2)',
                                borderRadius: 28,
                                padding: '36px 40px',
                                boxShadow: '0 0 60px rgba(232,121,249,0.1), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                            }}
                        >
                            <motion.h2
                                initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8, delay: 0.35 }}
                                style={{ fontSize: 40, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 18 }}
                            >
                                Build Your <br />
                                <span
                                    style={{
                                        background: 'linear-gradient(to right, #7c3aed, #00e5ff)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        display: 'inline-block',
                                        minWidth: '2ch',
                                    }}
                                >
                                    {typed}<motion.span
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        style={{ display: 'inline-block', width: 2, height: '1em', background: '#7c3aed', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1 }}
                                    />
                                </span>
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, marginBottom: 28 }}
                            >
                                Step into the future of career management. Our AI-driven ecosystem
                                is designed to accelerate your professional evolution like never before.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6, type: 'spring' }}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(124,58,237,0.2)',
                                    borderRadius: 16,
                                    padding: '18px 20px',
                                }}
                            >
                                <div style={{ fontSize: 11, color: '#00e5ff', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Join the community</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                                    "PriMaX changed how I view my career. The AI insights are scary accurate."
                                    <br /><span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>— Sarah J., Senior Designer</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    <ParticleCanvas count={40} networking={true} color="#e879f9" accent="#7c3aed" speed={0.4} opacity={0.35} />
                </div>

                {/* ── RIGHT SIDE: FORM ── */}
                <div className="auth-form-side">
                    {/* ambient glow behind card */}
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,121,249,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}
                    />
                    <motion.div
                        className="auth-card"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: 'spring', damping: 20 }}
                        style={{ position: 'relative', zIndex: 1 }}
                    >
                        <div className="auth-card-glass" style={{ boxShadow: '0 0 0 1px rgba(232,121,249,0.18), 0 40px 100px rgba(0,0,0,0.5), 0 0 80px rgba(232,121,249,0.1), 0 0 30px rgba(124,58,237,0.08)' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="auth-title" style={{ textAlign: 'left', fontSize: 32 }}>
                                    {formTyped}
                                    <motion.span
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        style={{ display: 'inline-block', width: 2, height: '0.8em', background: '#7c3aed', marginLeft: 4, verticalAlign: 'middle' }}
                                    />
                                </h1>
                                <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: 24 }}>Join 50,000+ growth pioneers</p>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="btn-google"
                                onClick={handleGoogle}
                                disabled={loading}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign up with Google
                            </motion.button>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="divider"
                            >
                                or register with email
                            </motion.div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div className="form-error" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', marginBottom: 20 }}>
                                        <FiAlertCircle size={14} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="form-group"
                                >
                                    <label className="form-label">Full name</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiUser size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                                        <input className="form-input" name="fullName" type="text" placeholder="Alex Rivera" value={form.fullName} onChange={handleChange} style={{ paddingLeft: 44 }} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="form-group"
                                >
                                    <label className="form-label">Email address</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiMail size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                                        <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} style={{ paddingLeft: 44 }} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="form-group"
                                >
                                    <label className="form-label">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiLock size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#44446a' }} />
                                        <input className="form-input" name="password" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={handleChange} style={{ paddingLeft: 44, paddingRight: 46 }} />
                                        <button type="button" onClick={() => setShowPass(p => !p)}
                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#44446a', cursor: 'pointer', padding: 4 }}>
                                            {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>

                                    {/* Password strength */}
                                    <AnimatePresence>
                                        {form.password && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div key={i} animate={{ background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.06)' }}
                                                            transition={{ duration: 0.3 }}
                                                            style={{ flex: 1, height: 4, borderRadius: 2 }} />
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 11, color: strengthColors[strength - 1] || '#44446a', fontWeight: 700 }}>
                                                    {strength > 0 ? strengthLabels[strength - 1] : 'Too short'}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="btn-auth"
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(232, 121, 249, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ marginTop: 10 }}
                                >
                                    {loading ? 'Processing...' : 'Create Account'}
                                </motion.button>
                            </form>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="auth-switch"
                                style={{ marginTop: 24 }}
                            >
                                Already have an account? <Link to="/login">Sign in</Link>
                            </motion.p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
