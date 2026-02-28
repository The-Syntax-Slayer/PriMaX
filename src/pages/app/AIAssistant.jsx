import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiSend, FiPlus, FiTrash2,
    FiChevronLeft, FiZap, FiClock, FiEdit2, FiCheck, FiX
} from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ── MATRIX RAIN COMPONENT ──
const MatrixRain = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array.from({ length: Math.floor(columns) }).map(() => 1);

        const draw = () => {
            ctx.fillStyle = 'rgba(6, 4, 20, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Using the assistant's purple tone for the matrix
            ctx.fillStyle = '#7c3aed';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0.1,
                zIndex: 0
            }}
        />
    );
};

// ── Gemini setup (same model as GlobalAI) ──────────────────────────────────
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the PriMaX AI Growth Coach — an elite personal development AI embedded inside PriMaX Hub, a premium AI-powered life OS.

Your personality:
- Motivating, direct, and deeply insightful
- Evidence-based (psychology, neuroscience, peak performance research)
- Personalised — always tailoring advice to what the user shares
- Concise: no fluff, always actionable
- CLEAN TEXT ONLY: Never use double asterisks (**) or markdown headers for emphasis. Use plain text or natural sentences instead.

You help users with:
- Goal setting & achievement systems
- Productivity & deep work
- Career & wealth building
- Fitness & mental health
- Habit formation & mindset mastery

Always end responses with a clear next action step. Keep replies focused and under 200 words unless a detailed plan is genuinely needed. Do not use any markdown bolding.`;

const WELCOME_MSG = {
    role: 'ai',
    text: "Hey! I'm your PriMaX AI Growth Coach ⚡ —  I've been briefed on the PriMaX growth framework. What would you like to work on today?",
};

const SUGGESTED_PROMPTS = [
    'Build me a powerful morning routine',
    'Create a 90-day goal achievement plan',
    'How do I overcome procrastination for good?',
    'Analyse my productivity patterns',
    'Help me with deep focus strategies',
    'Build a wealth-building strategy',
];

function buildChatInstance(history = []) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
    });
    return model.startChat({
        history,
        generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
    });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SessionItem({ session, isActive, onSelect, onDelete, onRename }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(session.title);

    const commitRename = async () => {
        setEditing(false);
        if (title.trim() && title !== session.title) onRename(session.id, title.trim());
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => !editing && onSelect(session.id)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(124,58,237,0.35)' : 'transparent'}`,
                transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
            <FiMessageCircle size={13} style={{ color: isActive ? '#7c3aed' : 'var(--text-3)', flexShrink: 0 }} />
            {editing ? (
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
                    onBlur={commitRename}
                    onClick={e => e.stopPropagation()}
                    style={{
                        flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(124,58,237,0.4)',
                        borderRadius: 6, padding: '2px 8px', color: 'white', fontSize: 12,
                        fontFamily: 'Inter, sans-serif', outline: 'none',
                    }}
                />
            ) : (
                <span style={{
                    flex: 1, fontSize: 12, fontWeight: 500,
                    color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {session.title}
                </span>
            )}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setEditing(true)}
                    style={{ background: 'none', border: 'none', padding: 3, cursor: 'pointer', color: 'var(--text-3)', borderRadius: 4, display: 'flex' }}
                    title="Rename"
                >
                    <FiEdit2 size={11} />
                </button>
                <button
                    onClick={() => onDelete(session.id)}
                    style={{ background: 'none', border: 'none', padding: 3, cursor: 'pointer', color: 'var(--text-3)', borderRadius: 4, display: 'flex' }}
                    title="Delete"
                >
                    <FiTrash2 size={11} />
                </button>
            </div>
        </motion.div>
    );
}

function TypingDots() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
            <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #00e5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <FiZap size={16} color="white" />
            </div>
            <div style={{
                padding: '12px 18px', borderRadius: '4px 18px 18px 18px',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', gap: 5, alignItems: 'center',
            }}>
                {[0, 1, 2].map(j => (
                    <motion.div
                        key={j}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #00e5ff)' }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AIAssistant() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [chatInstance, setChatInstance] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const bottomRef = useRef(null);

    const userName = user?.user_metadata?.full_name || 'Pioneer';
    const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Load sessions on mount
    useEffect(() => {
        if (!user) return;
        (async () => {
            setLoadingSessions(true);
            const { data } = await supabase
                .from('ai_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            setSessions(data || []);
            setLoadingSessions(false);
        })();
    }, [user]);

    // Load a session's messages
    const loadSession = useCallback(async (sessionId) => {
        if (!user) return;
        setActiveSessionId(sessionId);
        setMessages([WELCOME_MSG]);

        const { data } = await supabase
            .from('ai_history')
            .select('prompt, response')
            .eq('user_id', user.id)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        const msgs = [WELCOME_MSG];
        const geminiHistory = [];

        (data || []).forEach(h => {
            msgs.push({ role: 'user', text: h.prompt });
            msgs.push({ role: 'ai', text: h.response });
            geminiHistory.push({ role: 'user', parts: [{ text: h.prompt }] });
            geminiHistory.push({ role: 'model', parts: [{ text: h.response }] });
        });

        setMessages(msgs);
        setChatInstance(buildChatInstance(geminiHistory));
    }, [user]);

    // Create new session
    const createSession = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('ai_sessions')
            .insert({ user_id: user.id, title: 'New Conversation', module: 'global' })
            .select()
            .single();

        if (data) {
            setSessions(prev => [data, ...prev]);
            await loadSession(data.id);
        }
    };

    // Delete a session
    const deleteSession = async (sessionId) => {
        await supabase.from('ai_sessions').delete().eq('id', sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
            setMessages([WELCOME_MSG]);
            setChatInstance(null);
        }
    };

    // Rename session
    const renameSession = async (sessionId, newTitle) => {
        await supabase.from('ai_sessions').update({ title: newTitle }).eq('id', sessionId);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    };

    // Send message
    const sendMessage = async (text) => {
        const clean = text.trim();
        if (!clean || loading) return;

        // If no session, create one first
        let sid = activeSessionId;
        let currentChat = chatInstance;

        if (!sid) {
            const { data } = await supabase
                .from('ai_sessions')
                .insert({ user_id: user.id, title: clean.slice(0, 40), module: 'global' })
                .select().single();
            if (data) {
                sid = data.id;
                setSessions(prev => [data, ...prev]);
                setActiveSessionId(data.id);
            }
            currentChat = buildChatInstance([]);
            setChatInstance(currentChat);
        }

        if (!currentChat) {
            currentChat = buildChatInstance([]);
            setChatInstance(currentChat);
        }

        setMessages(m => [...m, { role: 'user', text: clean }]);
        setInput('');
        setLoading(true);

        try {
            const result = await currentChat.sendMessage(clean);
            let aiText = result.response.text();

            // Clean markdown bolding
            aiText = aiText.replace(/\*\*/g, '');

            setMessages(m => [...m, { role: 'ai', text: aiText }]);

            // Persist
            await supabase.from('ai_history').insert({
                user_id: user.id,
                module: 'global',
                session_id: sid,
                prompt: clean,
                response: aiText,
            });

            // Update session title from first user message & update timestamp
            const session = sessions.find(s => s.id === sid);
            const updatePayload = { updated_at: new Date().toISOString() };
            if (session?.title === 'New Conversation') {
                updatePayload.title = clean.slice(0, 45) + (clean.length > 45 ? '...' : '');
            }
            await supabase.from('ai_sessions').update(updatePayload).eq('id', sid);
            setSessions(prev => prev.map(s => s.id === sid ? { ...s, ...updatePayload } : s));

        } catch (err) {
            console.error('AI error:', err);
            setMessages(m => [...m, { role: 'ai', text: '⚠️ Connection error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="page-shell" style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0, padding: 0, overflow: 'hidden' }}>

            {/* ── SESSION SIDEBAR ── */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.div
                        key="ai-sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{
                            flexShrink: 0, height: '100%', overflow: 'hidden',
                            borderRight: '1px solid var(--app-border)',
                            background: 'rgba(6,4,20,0.95)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        <div style={{ padding: '20px 14px 12px', flexShrink: 0 }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                                    Conversations
                                </span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={createSession}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 7, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(0,229,255,0.1))',
                                    border: '1px solid rgba(124,58,237,0.35)', color: 'white',
                                    fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                }}
                            >
                                <FiPlus size={14} /> New Chat
                            </motion.button>
                        </div>

                        {/* Session list */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.2) transparent' }}>
                            {loadingSessions ? (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-3)', fontSize: 12 }}>Loading...</div>
                            ) : sessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-3)', fontSize: 12, lineHeight: 1.6 }}>
                                    No conversations yet.<br />Start one above ↑
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {sessions.map(s => (
                                        <SessionItem
                                            key={s.id}
                                            session={s}
                                            isActive={s.id === activeSessionId}
                                            onSelect={loadSession}
                                            onDelete={deleteSession}
                                            onRename={renameSession}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 14px', borderTop: '1px solid var(--app-border)',
                            fontSize: 10, color: 'var(--text-3)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                            Secure Neural Connection
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CHAT PANE ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--app-bg)' }}>

                {/* Chat toolbar */}
                <div style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--app-border)',
                    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                    background: 'rgba(6,4,20,0.8)', backdropFilter: 'blur(12px)',
                }}>
                    <button
                        onClick={() => setSidebarOpen(v => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', borderRadius: 6 }}
                        title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                    >
                        <FiChevronLeft size={18} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
                    </button>

                    {/* AI Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'linear-gradient(135deg, #7c3aed, #00e5ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(124,58,237,0.4)',
                        }}>
                            <FiZap size={16} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>AI Growth Coach</div>
                            <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                                Online · PriMaX Hub
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Session name */}
                    {activeSessionId && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiClock size={11} />
                            {sessions.find(s => s.id === activeSessionId)?.title || 'Session'}
                        </div>
                    )}
                </div>

                {/* Messages area */}
                <div style={{
                    flex: 1, position: 'relative', overflow: 'hidden',
                }}>
                    <MatrixRain />
                    <div style={{
                        position: 'absolute', inset: 0, overflowY: 'auto', padding: '24px 20px',
                        display: 'flex', flexDirection: 'column', gap: 18, zIndex: 1,
                        scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.2) transparent',
                    }}>
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28 }}
                                    style={{
                                        display: 'flex', gap: 10,
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    {/* Avatar */}
                                    {msg.role === 'ai' ? (
                                        <div style={{
                                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                            background: 'linear-gradient(135deg, #7c3aed, #00e5ff)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 0 14px rgba(124,58,237,0.35)',
                                        }}>
                                            <FiZap size={15} color="white" />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 13, color: 'white',
                                        }}>
                                            {userInitials}
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div style={{
                                        maxWidth: '72%', padding: '13px 17px',
                                        borderRadius: msg.role === 'ai' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                                        background: msg.role === 'ai'
                                            ? 'rgba(124,58,237,0.08)'
                                            : 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(0,229,255,0.25))',
                                        border: `1px solid ${msg.role === 'ai' ? 'rgba(124,58,237,0.18)' : 'transparent'}`,
                                        fontSize: 14, lineHeight: 1.75,
                                        color: 'var(--text-1)', whiteSpace: 'pre-wrap',
                                        backdropFilter: msg.role === 'ai' ? 'blur(4px)' : 'none',
                                    }}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && <TypingDots />}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Suggested prompts — only on fresh/empty session */}
                {messages.length <= 1 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}
                    >
                        {SUGGESTED_PROMPTS.map((p, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.03, borderColor: 'rgba(0,229,255,0.4)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => sendMessage(p)}
                                style={{
                                    padding: '7px 13px', borderRadius: 100, cursor: 'pointer',
                                    background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)',
                                    color: 'var(--text-2)', fontSize: 12, fontFamily: 'Inter, sans-serif',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {p}
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* Input row */}
                <div style={{
                    padding: '14px 20px', borderTop: '1px solid var(--app-border)',
                    background: 'rgba(6,4,20,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0,
                }}>
                    <div style={{
                        display: 'flex', gap: 10, alignItems: 'flex-end',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16,
                        padding: '10px 14px',
                        boxShadow: input ? '0 0 0 2px rgba(124,58,237,0.15)' : 'none',
                        transition: 'box-shadow 0.2s',
                    }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your AI coach anything — goals, habits, strategy, mindset..."
                            rows={1}
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif',
                                resize: 'none', lineHeight: 1.55, maxHeight: 120,
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>⏎ Send</span>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => sendMessage(input)}
                                disabled={!input.trim() || loading}
                                style={{
                                    width: 38, height: 38, borderRadius: 12, border: 'none',
                                    background: input.trim() && !loading
                                        ? 'linear-gradient(135deg, #7c3aed, #00e5ff)'
                                        : 'rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                    opacity: !input.trim() || loading ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: input.trim() ? '0 0 16px rgba(124,58,237,0.4)' : 'none',
                                }}
                            >
                                <FiSend size={16} color="white" />
                            </motion.button>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>
                        AI can make mistakes. Verify important information.
                    </div>
                </div>
            </div>
        </div>
    );
}
