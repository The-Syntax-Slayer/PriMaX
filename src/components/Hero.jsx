import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiZap, FiTrendingUp, FiAward, FiTarget, FiActivity, FiBarChart2 } from 'react-icons/fi';
import ParticleCanvas from './ParticleCanvas';

const statRings = [
    { label: 'Productivity Boost', value: '+340%', color: '#00e5ff' },
    { label: 'Goals Completed', value: '10M+', color: '#7c3aed' },
    { label: 'User Rating', value: '4.9\u2605', color: '#fbbf24' },
];

const previewModules = [
    { icon: <FiZap size={14} />, label: 'Productivity', value: '94%', color: '#00e5ff', bar: 94 },
    { icon: <FiTrendingUp size={14} />, label: 'Finance', value: '\u20B982,400', color: '#10b981', bar: 72 },
    { icon: <FiActivity size={14} />, label: 'Fitness', value: '18d streak', color: '#e879f9', bar: 86 },
    { icon: <FiBarChart2 size={14} />, label: 'Career Growth', value: '\u2191 +24pts', color: '#fbbf24', bar: 68 },
];

export default function Hero() {
    const ref = useRef(null);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, -80]);
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    return (
        <section
            ref={ref}
            id="hero"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #03030f 0%, #0a0318 40%, #001820 100%)',
            }}
        >
            <ParticleCanvas count={100} networking={true} color="#7c3aed" accent="#00e5ff" speed={0.5} maxDist={140} size={1.5} opacity={0.8} />

            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

            {/* Glow orbs */}
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.18, 0.12] }} transition={{ duration: 10, repeat: Infinity }} style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: '#7c3aed', filter: 'blur(120px)', top: '-20%', left: '-20%', pointerEvents: 'none' }} />
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }} transition={{ duration: 14, repeat: Infinity, delay: 3 }} style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: '#00e5ff', filter: 'blur(120px)', bottom: '-10%', right: '-10%', pointerEvents: 'none' }} />

            {/* Scan line */}
            <motion.div
                style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), rgba(124,58,237,0.25), transparent)', pointerEvents: 'none', zIndex: 1 }}
                animate={{ top: ['-5%', '110%'] }}
                transition={{ duration: 8, ease: 'linear', repeat: Infinity, repeatDelay: 5 }}
            />

            {/* ── TWO-COLUMN LAYOUT ── */}
            <motion.div style={{ y, opacity, position: 'relative', zIndex: 2, width: '100%' }}>
                <div className="hero-grid">

                    {/* LEFT: Content */}
                    <div>
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 28 }}>
                            <motion.span
                                className="section-tag"
                                animate={{ boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 20px rgba(0,229,255,0.3)', '0 0 0px rgba(0,229,255,0)'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ fontSize: 12, padding: '8px 22px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                                    <FiZap size={13} />
                                </motion.span>
                                Next-Gen AI Personal Growth Platform
                            </motion.span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12, color: '#f0f0ff' }}
                        >
                            Unlock Your
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                            style={{ marginBottom: 8 }}
                        >
                            <span style={{
                                fontFamily: 'Orbitron, monospace',
                                fontSize: 'clamp(34px, 5vw, 66px)',
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.05,
                                background: 'linear-gradient(135deg, #7c3aed 0%, #00e5ff 50%, #e879f9 100%)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                display: 'block',
                                animation: 'gradient-shift 4s linear infinite',
                            }}>
                                Maximum Potential
                            </span>
                        </motion.div>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                            style={{ fontSize: 'clamp(14px, 1.4vw, 18px)', color: '#8888b8', marginBottom: 10, fontWeight: 300 }}>
                            with Artificial Intelligence
                        </motion.p>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                            style={{ fontSize: 'clamp(13px, 1.2vw, 16px)', color: '#5a5a90', lineHeight: 1.85, marginBottom: 44, maxWidth: 480 }}>
                            PriMaX Hub fuses cutting-edge AI with neuroscience-backed growth frameworks — helping you build habits, crush goals, and evolve every single day.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.76 }}
                            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
                            <motion.a href="/signup" className="btn btn-primary" whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
                                style={{ fontSize: 15, padding: '16px 36px', borderRadius: '100px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                Start Growing Free <FiArrowRight />
                            </motion.a>
                            <motion.a href="#preview" className="btn btn-outline" whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
                                style={{ fontSize: 15, padding: '16px 36px', borderRadius: '100px' }}>
                                See it in Action
                            </motion.a>
                        </motion.div>

                        {/* Stats */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.88 }}
                            style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 28 }}>
                            {statRings.map((s, i) => (
                                <div key={i}>
                                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: '#44446a', marginTop: 3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Social proof */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex' }}>
                                {[260, 300, 200, 170, 130].map((hue, i) => (
                                    <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${hue},70%,50%), hsl(${hue + 40},70%,65%))`, border: '2px solid #03030f', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👤</div>
                                ))}
                            </div>
                            <span style={{ color: '#5a5a80', fontSize: 13 }}><span style={{ color: '#00e5ff', fontWeight: 800 }}>50,000+</span> growth pioneers onboard</span>
                            <span style={{ color: '#fbbf24', fontSize: 13 }}>★★★★★ <span style={{ color: '#5a5a80' }}>4.9</span></span>
                        </motion.div>
                    </div>

                    {/* RIGHT: Dashboard Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 60, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: 'relative' }}
                    >
                        <div style={{ position: 'absolute', inset: -40, borderRadius: 40, background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        <div style={{ borderRadius: 28, background: 'rgba(12, 8, 30, 0.88)', border: '1px solid rgba(124,58,237,0.25)', backdropFilter: 'blur(24px)', padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.12)', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(0,229,255,0.4), transparent)' }} />

                            {/* Card Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}>⚡</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f0ff', fontFamily: 'Orbitron, monospace', letterSpacing: '0.05em' }}>PriMa<span style={{ color: '#00e5ff' }}>X</span></div>
                                        <div style={{ fontSize: 10, color: '#5a5a90', marginTop: 1 }}>Command Center</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>LIVE</span>
                                </div>
                            </div>

                            {/* Growth Score Ring */}
                            <div style={{ textAlign: 'center', marginBottom: 22 }}>
                                <div style={{ display: 'inline-block', position: 'relative' }}>
                                    <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                                        <defs>
                                            <linearGradient id="heroScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#7c3aed" />
                                                <stop offset="100%" stopColor="#00e5ff" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <motion.circle cx="55" cy="55" r="44" fill="none" stroke="url(#heroScoreGrad)" strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={276.5}
                                            initial={{ strokeDashoffset: 276.5 }}
                                            animate={{ strokeDashoffset: 276.5 - (276.5 * 0.847) }}
                                            transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>847</div>
                                        <div style={{ fontSize: 9, color: '#5a5a90', fontWeight: 700, letterSpacing: '0.1em' }}>GROWTH</div>
                                    </div>
                                </div>
                            </div>

                            {/* Module Bars */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                {previewModules.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <div style={{ color: m.color, display: 'flex' }}>{m.icon}</div>
                                                <span style={{ fontSize: 11, color: '#8888b8', fontWeight: 600 }}>{m.label}</span>
                                            </div>
                                            <span style={{ fontSize: 11, color: m.color, fontWeight: 800 }}>{m.value}</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${m.bar}%` }}
                                                transition={{ duration: 1.2, delay: 1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${m.color}80, ${m.color})` }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* AI Insight */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                                style={{ marginTop: 18, padding: '11px 14px', borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🤖 AI Insight</div>
                                <div style={{ fontSize: 12, color: '#8888b8', lineHeight: 1.5 }}>Your productivity peaks 8–11 AM. Schedule deep work now.</div>
                            </motion.div>
                        </div>

                        {/* Floating accent cards */}
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', top: -18, right: -20, padding: '9px 14px', borderRadius: 14, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(12px)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FiAward size={11} /> +24 pts this week
                            </div>
                        </motion.div>
                        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            style={{ position: 'absolute', bottom: -14, left: -24, padding: '9px 14px', borderRadius: 14, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', backdropFilter: 'blur(12px)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FiTarget size={11} /> 21-day streak 🔥
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}
                animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <span style={{ fontSize: 9, color: '#44446a', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Scroll</span>
                <motion.div animate={{ scaleY: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(0,229,255,0.7), transparent)', transformOrigin: 'top' }} />
            </motion.div>

            <style>{`
                .hero-grid {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 100px 56px 80px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 72px;
                    align-items: center;
                }
                @media (max-width: 960px) {
                    .hero-grid {
                        grid-template-columns: 1fr !important;
                        padding: 80px 24px 60px !important;
                        gap: 48px !important;
                        text-align: center;
                    }
                    .hero-grid > div:last-child { order: -1; }
                }
            `}</style>
        </section>
    );
}
