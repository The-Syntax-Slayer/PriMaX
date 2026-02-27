import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiPlay, FiZap, FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi';
import ParticleCanvas from './ParticleCanvas';

const floatingBadges = [
    { icon: '🧠', label: 'AI-Powered Growth', x: '1.5%', y: '30%', delay: 0, color: '#7c3aed' },
    { icon: '📈', label: '+340% Productivity', x: '80%', y: '18%', delay: 0.4, color: '#00e5ff' },
    { icon: '✨', label: '10M+ Goals Achieved', x: '80%', y: '60%', delay: 0.8, color: '#e879f9' },
    { icon: '🎯', label: '98% Success Rate', x: '1.5%', y: '62%', delay: 0.6, color: '#fbbf24' },
];

const statRings = [
    { label: 'Productivity Boost', value: '+340%', color: '#00e5ff' },
    { label: 'Goals Completed', value: '10M+', color: '#7c3aed' },
    { label: 'User Rating', value: '4.9★', color: '#fbbf24' },
];

export default function Hero() {
    const ref = useRef(null);
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, -120]);
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
            {/* ── HEAVY PARTICLE NETWORK ── */}
            <ParticleCanvas
                count={120}
                networking={true}
                color="#7c3aed"
                accent="#00e5ff"
                speed={0.6}
                maxDist={160}
                size={2}
                opacity={0.9}
            />

            {/* ── GRID OVERLAY ── */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
                backgroundSize: '72px 72px',
            }} />

            {/* ── ANIMATED GLOW ORBS ── */}
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.18, 0.12] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: '#7c3aed', filter: 'blur(120px)', top: '-20%', left: '-20%', pointerEvents: 'none' }}
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: '#00e5ff', filter: 'blur(120px)', bottom: '-15%', right: '-15%', pointerEvents: 'none' }}
            />
            <motion.div
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
                style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#e879f9', filter: 'blur(100px)', top: '30%', left: '50%', opacity: 0.07, pointerEvents: 'none' }}
            />

            {/* ── SCAN LINE ── */}
            <motion.div
                style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), rgba(124,58,237,0.3), transparent)', pointerEvents: 'none', zIndex: 1 }}
                animate={{ top: ['-5%', '110%'] }}
                transition={{ duration: 8, ease: 'linear', repeat: Infinity, repeatDelay: 5 }}
            />

            {/* ── FLOATING BADGES ── */}
            {floatingBadges.map((b, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.4 + b.delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', left: b.x, top: b.y, zIndex: 1, pointerEvents: 'none' }}
                    className="hero-badge-wrapper"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 5 + i * 1.2, ease: 'easeInOut', repeat: Infinity, delay: i * 0.7 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 9,
                            padding: '10px 18px',
                            background: 'rgba(6, 6, 24, 0.75)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${b.color}35`,
                            borderRadius: 100,
                            fontSize: 13, fontWeight: 700, color: '#eeeeff',
                            whiteSpace: 'nowrap',
                            boxShadow: `0 0 20px ${b.color}25, 0 4px 20px rgba(0,0,0,0.4)`,
                        }}
                    >
                        <span style={{ fontSize: 16 }}>{b.icon}</span>
                        <span>{b.label}</span>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                    </motion.div>
                </motion.div>
            ))}

            {/* ── MAIN CONTENT ── */}
            <motion.div style={{ y, opacity, position: 'relative', zIndex: 2, width: '100%' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', padding: '0 clamp(80px, 20vw, 240px)' }}>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{ marginBottom: 32 }}
                    >
                        <motion.span
                            className="section-tag"
                            animate={{ boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 20px rgba(0,229,255,0.3)', '0 0 0px rgba(0,229,255,0)'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{ fontSize: 12, padding: '8px 22px' }}
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
                        style={{ fontSize: 'clamp(38px, 7.5vw, 96px)', fontWeight: 900, marginBottom: 10, letterSpacing: '-0.025em', lineHeight: 1.02 }}
                    >
                        Unlock Your
                    </motion.h1>

                    {/* Gradient word — separate for animation */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        style={{ marginBottom: 18 }}
                    >
                        <span style={{
                            fontFamily: 'Orbitron, monospace',
                            fontSize: 'clamp(36px, 7vw, 92px)',
                            fontWeight: 900,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.0,
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

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.55 }}
                        style={{ fontSize: 'clamp(16px, 1.6vw, 19px)', color: '#8888b8', marginBottom: 14, fontWeight: 300, letterSpacing: '0.02em' }}
                    >
                        with Artificial Intelligence
                    </motion.p>

                    {/* Sub-headline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.65 }}
                        style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#6666a0', maxWidth: 600, margin: '0 auto 52px', lineHeight: 1.85 }}
                    >
                        PriMaX Hub fuses cutting-edge AI with neuroscience-backed growth frameworks to help you build habits, crush goals, and evolve — every single day.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.78 }}
                        style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 70 }}
                    >
                        <motion.a
                            href="/signup"
                            className="btn btn-primary"
                            whileHover={{ scale: 1.06, y: -3 }}
                            whileTap={{ scale: 0.96 }}
                            style={{ fontSize: 16, padding: '18px 40px', borderRadius: '100px', fontWeight: 800 }}
                        >
                            Start Growing Free <FiArrowRight />
                        </motion.a>
                        <motion.a
                            href="#preview"
                            className="btn btn-outline"
                            whileHover={{ scale: 1.06, y: -3 }}
                            whileTap={{ scale: 0.96 }}
                            style={{ fontSize: 16, padding: '18px 40px', borderRadius: '100px' }}
                        >
                            <FiPlay size={16} /> Watch Demo
                        </motion.a>
                    </motion.div>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.7 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}
                    >
                        {statRings.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                whileHover={{ scale: 1.06, y: -3 }}
                                style={{
                                    padding: '14px 24px', borderRadius: 18,
                                    background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)',
                                    border: `1px solid ${s.color}25`,
                                    boxShadow: `0 0 30px ${s.color}12`,
                                    textAlign: 'center', minWidth: 130,
                                }}
                            >
                                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: '#5a5a80', marginTop: 6, fontWeight: 600, letterSpacing: '0.05em' }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.8 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {[260, 300, 200, 170, 130].map((hue, i) => (
                                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${hue},70%,50%), hsl(${hue + 40},70%,65%))`, border: '2px solid #03030f', marginLeft: i === 0 ? 0 : -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: `0 0 10px rgba(124,58,237,0.3)` }}>
                                    👤
                                </div>
                            ))}
                        </div>
                        <div style={{ color: '#6666a0', fontSize: 14 }}>
                            <span style={{ color: '#00e5ff', fontWeight: 800 }}>50,000+</span> growth pioneers already onboard
                        </div>
                        <div style={{ display: 'flex', gap: 3, color: '#fbbf24', alignItems: 'center' }}>
                            {'★★★★★'.split('').map((s, i) => <span key={i} style={{ fontSize: 16 }}>{s}</span>)}
                            <span style={{ color: '#6666a0', marginLeft: 6, fontSize: 14 }}>4.9/5</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* ── SCROLL INDICATOR ── */}
            <motion.div
                style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 3 }}
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
            >
                <span style={{ fontSize: 10, color: '#44446a', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Scroll</span>
                <motion.div
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 1, height: 50, background: 'linear-gradient(to bottom, rgba(0,229,255,0.7), transparent)', transformOrigin: 'top' }}
                />
            </motion.div>

            {/* Mobile-hide floating badges */}
            <style>{`
                @media (max-width: 768px) {
                    .hero-badge-wrapper { display: none !important; }
                }
            `}</style>
        </section>
    );
}
