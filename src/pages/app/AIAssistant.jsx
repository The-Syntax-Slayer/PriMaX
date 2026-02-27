import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiSend, FiRefreshCw } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../../contexts/AuthContext';

// Initialise Gemini client once
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
function getModel() {
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
    });
}

const SYSTEM_PROMPT = `You are the PriMaX AI Growth Coach — an elite personal development AI embedded inside PriMaX Hub, a premium AI-powered life OS.

Your personality:
- Motivating, direct, and deeply insightful
- Evidence-based (psychology, neuroscience, peak performance research)
- Personalised — always tailoring advice to what the user shares
- Concise: no fluff, always actionable

You help users with:
- Goal setting & achievement systems
- Productivity & deep work
- Career & wealth building
- Fitness & mental health
- Habit formation & mindset mastery

Always end responses with a clear next action step. Keep replies focused and under 200 words unless a detailed plan is genuinely needed.`;

const suggestedPrompts = [
    'Help me build a powerful morning routine',
    'Analyse my productivity and suggest improvements',
    'Create a 90-day goal achievement plan',
    'How do I overcome procrastination for good?',
    'Build a wealth-building strategy for me',
    'Help me improve deep focus and attention',
];

const initialMessages = [
    {
        from: 'ai',
        text: "Hey! I'm your PriMaX AI Growth Coach 🤖 — powered by Gemini AI. I've been briefed on the PriMaX growth framework and I'm here to help you build your best life. What would you like to work on today?",
    },
];

export default function AIAssistant() {
    const { user } = useAuth();
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chat, setChat] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const loadHistory = async () => {
            const { data, error } = await supabase
                .from('ai_history')
                .select('*')
                .eq('user_id', user.id)
                .eq('module', 'global')
                .order('created_at', { ascending: true });

            if (data && data.length > 0) {
                const historyMsgs = [];
                data.forEach(h => {
                    historyMsgs.push({ from: 'user', text: h.input });
                    historyMsgs.push({ from: 'ai', text: h.output });
                });
                setMessages([...initialMessages, ...historyMsgs]);

                // Also update Gemini's internal history
                const geminiHistory = data.map(h => ([
                    { role: 'user', parts: [{ text: h.input }] },
                    { role: 'model', parts: [{ text: h.output }] }
                ])).flat();

                const newChat = getModel().startChat({
                    history: geminiHistory,
                    generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
                });
                setChat(newChat);
            } else {
                const newChat = getModel().startChat({
                    history: [],
                    generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
                });
                setChat(newChat);
            }
        };

        loadHistory();
    }, [user]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (text) => {
        if (!text.trim() || !chat || !user) return;
        const userMsg = { from: 'user', text };
        setMessages(m => [...m, userMsg]);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const result = await chat.sendMessage(text);
            const aiText = result.response.text();
            setMessages(m => [...m, { from: 'ai', text: aiText }]);

            // Persist to Supabase
            await supabase.from('ai_history').insert({
                user_id: user.id,
                module: 'global',
                topic: 'chat',
                input: text,
                output: aiText
            });

        } catch (err) {
            console.error('Gemini error:', err);
            setError('AI is temporarily unavailable. Please try again.');
            setMessages(m => [...m, { from: 'ai', text: '⚠️ I hit a snag connecting to the AI engine. Please try again in a moment.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    const handleNewSession = async () => {
        if (!window.confirm('Clear chat history and start a new session?')) return;

        // Delete history from Supabase for this user (global/chat)
        await supabase
            .from('ai_history')
            .delete()
            .eq('user_id', user.id)
            .eq('module', 'global');

        const newChat = getModel().startChat({
            history: [],
            generationConfig: { maxOutputTokens: 512, temperature: 0.85 },
        });
        setChat(newChat);
        setMessages(initialMessages);
        setError('');
    };

    const userName = user?.user_metadata?.full_name || 'Growth Pioneer';
    const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)' }}>
            {/* Header */}
            <div className="page-header" style={{ flexShrink: 0 }}>
                <div className="page-tag"><FiMessageCircle size={10} /> AI Assistant</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">AI Growth Coach</h1>
                        <p className="page-desc">Powered by Gemini AI — your personal coach trained on peak performance science.</p>
                    </div>
                    <button
                        onClick={handleNewSession}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--app-border)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600 }}
                    >
                        <FiRefreshCw size={13} /> New Session
                    </button>
                </div>
            </div>

            {/* Chat area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, paddingRight: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}>
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                        {msg.from === 'ai' && (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
                        )}
                        <div style={{
                            maxWidth: '72%',
                            padding: '14px 18px',
                            borderRadius: msg.from === 'ai' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                            background: msg.from === 'ai' ? 'var(--app-surface)' : 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(0,245,255,0.4))',
                            border: `1px solid ${msg.from === 'ai' ? 'var(--app-border)' : 'transparent'}`,
                            fontSize: 14,
                            lineHeight: 1.75,
                            color: 'var(--text-1)',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {msg.text}
                        </div>
                        {msg.from === 'user' && (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {userInitials}
                            </div>
                        )}
                    </motion.div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                        <div style={{ padding: '14px 20px', borderRadius: '4px 18px 18px 18px', background: 'var(--app-surface)', border: '1px solid var(--app-border)', display: 'flex', gap: 6, alignItems: 'center' }}>
                            {[0, 1, 2].map(j => (
                                <motion.div
                                    key={j}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.18 }}
                                    style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #00f5ff)' }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggested prompts — only on fresh session */}
            {messages.length <= 1 && (
                <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {suggestedPrompts.map((p, i) => (
                        <motion.button
                            key={i}
                            onClick={() => sendMessage(p)}
                            whileHover={{ scale: 1.03, borderColor: 'rgba(0,245,255,0.4)' }}
                            style={{ padding: '8px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--text-1)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                        >
                            {p}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 16 }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask your AI coach anything — goals, habits, strategy, mindset..."
                        rows={1}
                        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', flex: 1, resize: 'none', lineHeight: 1.5 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>↵ Enter</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #00f5ff)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}
                >
                    <FiSend size={18} color="white" />
                </motion.button>
            </div>
        </div>
    );
}
