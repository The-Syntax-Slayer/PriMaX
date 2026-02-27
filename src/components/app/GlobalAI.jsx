import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiZap, FiChevronRight, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function GlobalAI() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [msgs, setMsgs] = useState([
        { role: 'ai', text: 'Hi! I\'m your PriMaX AI assistant. I have context on your career, fitness, and overall goals. How can I help you right now?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const chatEndRef = useRef(null);

    // Fetch history
    useEffect(() => {
        if (user && isOpen && msgs.length === 1) {
            (async () => {
                setLoadingHistory(true);
                const { data } = await supabase
                    .from('ai_history')
                    .select('prompt, response, created_at')
                    .eq('user_id', user.id)
                    .eq('module', 'global')
                    .order('created_at', { ascending: true })
                    .limit(20);

                if (data && data.length > 0) {
                    const historical = data.flatMap(d => [
                        { role: 'user', text: d.prompt },
                        { role: 'ai', text: d.response }
                    ]);
                    setMsgs(p => [...p, ...historical]);
                }
                setLoadingHistory(false);
            })();
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, isOpen]);

    // Global hotkey cmd+j or ctrl+j to open AI
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userTxt = input.trim();
        setInput('');
        setMsgs((p) => [...p, { role: 'user', text: userTxt }]);
        setLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are the PriMaX Hub Global AI, an elite personal assistant. Context: The user is using a productivity, finance, career, and fitness app. Answer concisely, smartly, and use formatting. User: ${userTxt}`;
            const result = await model.generateContent(prompt);
            const aiTxt = result.response.text();
            setMsgs((p) => [...p, { role: 'ai', text: aiTxt }]);

            // Persist to DB
            if (user) {
                await supabase.from('ai_history').insert({
                    user_id: user.id,
                    module: 'global',
                    prompt: userTxt,
                    response: aiTxt
                });
            }
        } catch (e) {
            setMsgs((p) => [...p, { role: 'ai', text: '⚠️ Connection error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = ['Plan my day', 'Summarize my stats', 'Quick workout'];

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #00f5ff)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
                        cursor: 'pointer',
                        zIndex: 9999,
                    }}
                >
                    <FiZap size={24} />
                    {/* subtle ping animation */}
                    <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid white' }}
                    />
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                        style={{
                            position: 'fixed',
                            bottom: isExpanded ? 24 : 24,
                            right: isExpanded ? 24 : 24,
                            width: isExpanded ? 'calc(100vw - 48px)' : 380,
                            height: isExpanded ? 'calc(100vh - 48px)' : 600,
                            maxWidth: isExpanded ? 1200 : '100%',
                            borderRadius: 20,
                            background: 'rgba(13, 11, 28, 0.97)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(124,58,237,0.25)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(124,58,237,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 10000,
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--app-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <FiZap size={16} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>PriMaX AI Base</div>
                                    <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Connected to all domains</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} title={isExpanded ? 'Minimize' : 'Maximize'}>
                                    {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }} title="Close (⌘J)">
                                    <FiX size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {msgs.map((m, i) => (
                                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                                        {m.role === 'ai' && <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 4 }}>P</div>}
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: m.role === 'user' ? 'var(--app-border)' : 'rgba(124,58,237,0.1)',
                                            border: m.role === 'user' ? 'none' : '1px solid rgba(124,58,237,0.2)',
                                            color: 'var(--text-1)',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {m.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5ff' }} />
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: 16, borderTop: '1px solid var(--app-border)', background: 'rgba(0,0,0,0.2)' }}>
                            {msgs.length === 1 && (
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => setInput(s)} style={{ padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>{s}</button>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--app-border)', padding: '8px 12px', borderRadius: 16 }}>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                    placeholder="Ask PriMaX AI (⌘J to toggle)..."
                                    rows={Math.min(4, input.split('\n').length)}
                                    style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', padding: '4px 0', maxHeight: 120 }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={send}
                                    disabled={!input.trim() || loading}
                                    style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #00f5ff)' : 'rgba(255,255,255,0.1)', border: 'none', color: input.trim() ? 'white' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.2s' }}
                                >
                                    <FiSend size={16} style={{ marginLeft: -2, marginTop: 2 }} />
                                </motion.button>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>AI can make mistakes. Verify important information.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
