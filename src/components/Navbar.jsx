import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiMenu, FiX } from 'react-icons/fi';

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'AI Engine', href: '#ai' },
    { label: 'How It Works', href: '#how' },
    { label: 'Preview', href: '#preview' },
    { label: 'Pricing', href: '#benefits' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                padding: '0 24px',
                transition: 'all 0.4s ease',
                background: scrolled
                    ? 'rgba(5, 5, 16, 0.85)'
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(0,245,255,0.1)' : '1px solid transparent',
            }}
        >
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
                <motion.a
                    href="#"
                    whileHover={{ scale: 1.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                >
                    {/* Premium Logo Icon */}
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #00e5ff 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 24px rgba(124,58,237,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
                        position: 'relative', overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', position: 'relative', zIndex: 1 }}>PX</span>
                    </div>
                    {/* Brand Name */}
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 15, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1 }}>
                        <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #f0f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PriMaX</span><span style={{ color: '#00e5ff', WebkitTextFillColor: '#00e5ff', WebkitBackgroundClip: 'unset' }}> Hub</span>
                    </span>
                </motion.a>

                {/* Desktop nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
                    {navLinks.map((link) => (
                        <motion.a
                            key={link.label}
                            href={link.href}
                            whileHover={{ color: '#00f5ff' }}
                            style={{ color: '#9898c0', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
                        >
                            {link.label}
                        </motion.a>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <motion.a
                        href="/signup"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="btn btn-primary"
                        style={{ fontSize: 14, padding: '10px 22px' }}
                    >
                        Start for Free
                    </motion.a>
                    <button
                        onClick={() => setOpen(!open)}
                        style={{ background: 'none', border: 'none', color: '#f0f0ff', cursor: 'pointer', display: 'none' }}
                        className="mobile-menu-btn"
                    >
                        {open ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            overflow: 'hidden',
                            background: 'rgba(5,5,16,0.97)',
                            borderTop: '1px solid rgba(0,245,255,0.1)',
                            paddingBottom: 16,
                        }}
                    >
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                style={{ display: 'block', padding: '12px 24px', color: '#9898c0', textDecoration: 'none', fontSize: 15, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </motion.nav>
    );
}
