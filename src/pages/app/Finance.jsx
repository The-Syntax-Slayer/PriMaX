import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiPlus, FiTrash2, FiZap, FiRotateCcw, FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { callGemini, SYSTEM_PROMPTS } from '../../lib/aiService';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { useCallback } from 'react';

const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} style={{ display: 'inline-flex', color: '#7c3aed' }}>
        <FiRotateCcw size={13} />
    </motion.div>
);

const Card = ({ children, style = {} }) => (
    <div style={{ borderRadius: 20, background: 'var(--app-surface)', border: '1px solid var(--app-border)', backdropFilter: 'blur(12px)', padding: 22, position: 'relative', overflow: 'hidden', ...style }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
        {children}
    </div>
);

const CATEGORIES = ['Food & Drink', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Other'];
const CAT_COLORS = { 'Food & Drink': '#f59e0b', 'Transport': '#00e5ff', 'Housing': '#7c3aed', 'Entertainment': '#ec4899', 'Health': '#10b981', 'Shopping': '#f97316', 'Utilities': '#6366f1', 'Other': '#64748b' };
const CAT_ICONS = { 'Food & Drink': '🍕', 'Transport': '🚗', 'Housing': '🏠', 'Entertainment': '🎬', 'Health': '💊', 'Shopping': '🛍️', 'Utilities': '⚡', 'Other': '📦' };

const TABS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'budgets', label: 'Budget', icon: '🎯' },
    { id: 'savings', label: 'Savings', icon: '🏦' },
    { id: 'subscriptions', label: 'Subs', icon: '🗓️' },
    { id: 'ai', label: 'AI Advisor', icon: '🤖' },
];

export default function Finance() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    return (
        <div className="page-shell">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 28 }}>
                <div className="page-tag"><FiDollarSign size={10} /> Finance</div>
                <h1 className="page-title">Financial Dashboard</h1>
                <p className="page-desc">Track income, spending, and savings with AI-powered financial insights.</p>
            </motion.div>
            <div className="module-tabs" style={{ marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`module-tab${tab === t.id ? ' active' : ''}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
                    {tab === 'overview' && <FinanceOverview userId={user.id} />}
                    {tab === 'transactions' && <Transactions userId={user.id} />}
                    {tab === 'budgets' && <Budgets userId={user.id} />}
                    {tab === 'savings' && <SavingsGoals userId={user.id} />}
                    {tab === 'subscriptions' && <Subscriptions userId={user.id} />}
                    {tab === 'ai' && <AIFinanceAdvisor userId={user.id} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function FinanceOverview({ userId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            const [txRes, goalRes] = await Promise.all([
                supabase.from('transactions').select('amount,type,category').eq('user_id', userId),
                supabase.from('savings_goals').select('*').eq('user_id', userId),
            ]);
            const txs = txRes.data || [];
            const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
            // Category breakdown
            const catBreakdown = {};
            txs.filter(t => t.type === 'expense').forEach(t => { catBreakdown[t.category] = (catBreakdown[t.category] || 0) + Number(t.amount); });
            setData({ income, expense, net: income - expense, goals: goalRes.data || [], txCount: txs.length, catBreakdown });
            setLoading(false);
        })();
    }, [userId]);

    if (loading) return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 18 }} />)}
        </div>
    );

    if (!data.txCount && !data.goals.length) return (
        <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">Financial dashboard is empty</div>
            <div className="empty-state-desc">Add your first transaction or savings goal to get started.</div>
        </div>
    );

    const stats = [
        { label: 'Total Income', value: `₹${data.income.toFixed(0)}`, delta: '+this period', color: '#10b981', icon: '📈', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        { label: 'Total Expenses', value: `₹${data.expense.toFixed(0)}`, delta: 'all categories', color: '#ef4444', icon: '📉', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)' },
        { label: 'Net Balance', value: `${data.net >= 0 ? '+' : ''}₹${data.net.toFixed(0)}`, delta: data.net >= 0 ? 'Positive' : 'Deficit', color: data.net >= 0 ? '#00e5ff' : '#f59e0b', icon: data.net >= 0 ? '✅' : '⚠️', bg: data.net >= 0 ? 'rgba(0,229,255,0.07)' : 'rgba(245,158,11,0.08)', border: data.net >= 0 ? 'rgba(0,229,255,0.18)' : 'rgba(245,158,11,0.2)' },
        { label: 'Savings Goals', value: data.goals.length, delta: 'active goals', color: '#7c3aed', icon: '🏦', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
    ];

    const topCats = Object.entries(data.catBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = topCats[0]?.[1] || 1;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {stats.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.03, y: -3 }}
                        style={{ padding: '22px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${s.color}18`, filter: 'blur(15px)' }} />
                        <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{s.delta}</div>
                    </motion.div>
                ))}
            </div>

            {topCats.length > 0 && (
                <Card>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
                        📊 Spending by Category
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {topCats.map(([cat, amt], i) => (
                            <motion.div key={cat} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>{CAT_ICONS[cat] || '📦'}</span> {cat}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: CAT_COLORS[cat] || '#5a5a80' }}>₹{amt.toFixed(0)}</span>
                                </div>
                                <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(amt / maxCat) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${CAT_COLORS[cat] || '#5a5a80'}, ${CAT_COLORS[cat] || '#5a5a80'}88)` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {data.goals.length > 0 && (
                <Card style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>🏦 Savings Goals</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {data.goals.map(g => {
                            const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
                            return (
                                <div key={g.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{g.icon} {g.name}</span>
                                        <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800 }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #10b981, #00e5ff)' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>₹{Number(g.current_amount).toFixed(0)} of ₹{Number(g.target_amount).toFixed(0)}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}

function Transactions({ userId }) {
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0] });

    const fetchTxs = useCallback(() => {
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50)
            .then(({ data }) => { setTxs(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchTxs(); }, [fetchTxs]);
    useRealtimeRefresh('transactions', userId, fetchTxs);

    const addTx = async () => {
        if (!form.description.trim() || !form.amount) return;
        const amt = parseFloat(form.amount);
        const { data, error } = await supabase.from('transactions').insert({ user_id: userId, ...form, amount: amt }).select().single();

        if (!error && data) {
            setTxs(t => [data, ...t]);

            // Check if budget exceeded
            if (form.type === 'expense') {
                const { data: budget } = await supabase.from('budgets').select('*').eq('user_id', userId).eq('category', form.category).single();
                if (budget) {
                    const now = new Date(); const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                    const { data: tRes } = await supabase.from('transactions').select('amount').eq('user_id', userId).eq('category', form.category).eq('type', 'expense').gte('date', firstDay);
                    const spent = (tRes || []).reduce((s, t) => s + Number(t.amount), 0);

                    if (spent > budget.limit_amount) {
                        await supabase.from('notifications').insert({
                            user_id: userId,
                            title: 'Budget Alert!',
                            message: `Warning: You have exceeded your ${form.category} budget by ₹₹{(spent - budget.limit_amount).toFixed(2)}.`,
                            type: 'warning'
                        });
                    }
                }
            }
        }
        setForm({ description: '', amount: '', type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0] }); setAdding(false);
    };
    const delTx = async (id) => { await supabase.from('transactions').delete().eq('id', id); setTxs(ts => ts.filter(t => t.id !== id)); };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                <AnimatePresence>
                    {!adding ? (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAdding(true)} className="btn-add" whileHover={{ scale: 1.02 }}>
                            <FiPlus size={14} /> Add Transaction
                        </motion.button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Card style={{ padding: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTx()} placeholder="Description" className="app-input" autoFocus />
                                    <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" className="app-input" />
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="app-select">
                                        <option value="expense">💸 Expense</option>
                                        <option value="income">💰 Income</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="app-select">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="app-input" style={{ colorScheme: 'dark' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={addTx} className="btn-save">Save</button>
                                    <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!txs.length ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💳</div>
                    <div className="empty-state-title">No transactions yet</div>
                    <div className="empty-state-desc">Record income and expenses to track your finances.</div>
                    <button onClick={() => setAdding(true)} className="btn-add">Add First Transaction</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AnimatePresence>
                        {txs.map((t, i) => (
                            <motion.div key={t.id}
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i > 10 ? 0 : i * 0.04 }}
                                whileHover={{ x: 4 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: 'var(--app-surface)', border: `1px solid ${t.type === 'income' ? 'rgba(16,185,129,0.15)' : 'var(--app-border)'}`, transition: 'all 0.22s' }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${CAT_COLORS[t.category] || '#5a5a80'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                    {CAT_ICONS[t.category] || '📦'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{t.description}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '1px 7px', borderRadius: 6, background: `${CAT_COLORS[t.category] || '#5a5a80'}14` }}>{t.category}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.date}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 800, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                                    {t.type === 'income' ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                                </div>
                                <button onClick={() => delTx(t.id)} className="btn-danger"><FiTrash2 size={13} /></button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function Budgets({ userId }) {
    const [budgets, setBudgets] = useState([]);
    const [spending, setSpending] = useState({});
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ category: 'Food & Drink', limit_amount: '' });

    const fetchBudgets = useCallback(() => {
        (async () => {
            const now = new Date(); const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const [bRes, tRes] = await Promise.all([
                supabase.from('budgets').select('*').eq('user_id', userId),
                supabase.from('transactions').select('amount,category').eq('user_id', userId).eq('type', 'expense').gte('date', firstDay),
            ]);
            const sp = {};
            (tRes.data || []).forEach(t => { sp[t.category] = (sp[t.category] || 0) + Number(t.amount); });
            setBudgets(bRes.data || []); setSpending(sp); setLoading(false);
        })();
    }, [userId]);

    useEffect(() => { fetchBudgets(); }, [fetchBudgets]);
    useRealtimeRefresh('budgets', userId, fetchBudgets);
    useRealtimeRefresh('transactions', userId, fetchBudgets);

    const addBudget = async () => {
        if (!form.limit_amount) return;
        const color = CAT_COLORS[form.category] || '#7c3aed';
        const { data, error } = await supabase.from('budgets').insert({ user_id: userId, ...form, limit_amount: parseFloat(form.limit_amount), color }).select().single();
        if (!error && data) setBudgets(b => [...b, data]);
        setForm({ category: 'Food & Drink', limit_amount: '' }); setAdding(false);
    };
    const delBudget = async (id) => { await supabase.from('budgets').delete().eq('id', id); setBudgets(bs => bs.filter(b => b.id !== id)); };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                {!adding ? (
                    <button onClick={() => setAdding(true)} className="btn-add"><FiPlus size={14} /> Add Budget Limit</button>
                ) : (
                    <Card style={{ padding: 18 }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="app-select" style={{ flex: 1 }}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <input value={form.limit_amount} onChange={e => setForm(f => ({ ...f, limit_amount: e.target.value }))} placeholder="Monthly limit ₹" type="number" className="app-input" style={{ flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={addBudget} className="btn-save">Save</button>
                            <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                        </div>
                    </Card>
                )}
            </div>

            {!budgets.length ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <div className="empty-state-title">No budget limits set</div>
                    <div className="empty-state-desc">Set monthly limits to control your spending.</div>
                    <button onClick={() => setAdding(true)} className="btn-add">Set First Budget</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {budgets.map((b, i) => {
                        const spent = spending[b.category] || 0;
                        const pct = Math.min(100, Math.round((spent / Number(b.limit_amount)) * 100));
                        const over = pct >= 100;
                        const color = over ? '#ef4444' : b.color;
                        return (
                            <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                whileHover={{ y: -2 }}>
                                <Card style={{ borderLeft: `3px solid ${color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                                {CAT_ICONS[b.category] || '📦'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{b.category}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>₹{spent.toFixed(0)} / ₹{Number(b.limit_amount).toFixed(0)} this month</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                            <span style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'Orbitron, monospace' }}>{pct}%</span>
                                            <button onClick={() => delBudget(b.id)} className="btn-danger"><FiTrash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: '100%', borderRadius: 4, background: over ? '#ef4444' : `linear-gradient(90deg, ${b.color}, ${b.color}88)` }} />
                                    </div>
                                    {over && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            style={{ marginTop: 10, padding: '7px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                                            ⚠️ Budget exceeded by ₹{(spent - Number(b.limit_amount)).toFixed(0)}
                                        </motion.div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SavingsGoals({ userId }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [deposit, setDeposit] = useState({});
    const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', icon: '🎯', target_date: '' });
    const ICONS = ['🎯', '🏠', '✈️', '💻', '🎓', '🚗', '💍', '🏋️', '📱', '🎸'];

    const fetchGoals = useCallback(() => {
        supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at')
            .then(({ data }) => { setGoals(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);
    useRealtimeRefresh('savings_goals', userId, fetchGoals);

    const addGoal = async () => {
        if (!form.name.trim() || !form.target_amount) return;
        const { data, error } = await supabase.from('savings_goals').insert({ user_id: userId, ...form, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount || 0), color: '#10b981' }).select().single();
        if (!error && data) setGoals(g => [...g, data]);
        setForm({ name: '', target_amount: '', current_amount: '0', icon: '🎯', target_date: '' }); setAdding(false);
    };
    const addDeposit = async (goal) => {
        const amt = parseFloat(deposit[goal.id] || 0);
        if (!amt) return;
        const newAmt = Math.min(Number(goal.target_amount), Number(goal.current_amount) + amt);
        await supabase.from('savings_goals').update({ current_amount: newAmt }).eq('id', goal.id);
        setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, current_amount: newAmt } : g));
        setDeposit(d => ({ ...d, [goal.id]: '' }));
    };
    const delGoal = async (id) => { await supabase.from('savings_goals').delete().eq('id', id); setGoals(gs => gs.filter(g => g.id !== id)); };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                {!adding ? (
                    <button onClick={() => setAdding(true)} className="btn-add"><FiPlus size={14} /> New Goal</button>
                ) : (
                    <Card style={{ padding: 18, marginBottom: 18 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            {ICONS.map(i => (
                                <motion.button key={i} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setForm(f => ({ ...f, icon: i }))}
                                    style={{ width: 38, height: 38, borderRadius: 10, background: form.icon === i ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: form.icon === i ? '2px solid rgba(124,58,237,0.5)' : '1px solid var(--app-border)', cursor: 'pointer', fontSize: 18, boxShadow: form.icon === i ? '0 0 12px rgba(124,58,237,0.3)' : 'none' }}>
                                    {i}
                                </motion.button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Goal name" className="app-input" />
                            <input value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="Target ₹" type="number" className="app-input" />
                            <input value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} placeholder="Already saved ₹" type="number" className="app-input" />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={addGoal} className="btn-save">Create Goal</button>
                            <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                        </div>
                    </Card>
                )}
            </div>

            {!goals.length ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <div className="empty-state-title">No savings goals yet</div>
                    <div className="empty-state-desc">Create goals and track your progress toward financial dreams.</div>
                    <button onClick={() => setAdding(true)} className="btn-add">Create a Goal</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                    {goals.map((g, i) => {
                        const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
                        const complete = pct >= 100;
                        return (
                            <motion.div key={g.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                                whileHover={{ y: -4 }}>
                                <Card style={{ border: complete ? '1px solid rgba(16,185,129,0.3)' : 'var(--app-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <motion.div
                                                animate={complete ? { rotate: [0, 10, -5, 0], scale: [1, 1.1, 1] } : {}}
                                                transition={{ duration: 1, repeat: complete ? Infinity : 0, repeatDelay: 3 }}
                                                style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: complete ? '0 0 16px rgba(16,185,129,0.4)' : 'none' }}
                                            >{g.icon}</motion.div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{g.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Target: ₹{Number(g.target_amount).toFixed(0)}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => delGoal(g.id)} className="btn-danger" style={{ alignSelf: 'flex-start' }}><FiTrash2 size={13} /></button>
                                    </div>
                                    <div style={{ height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.05)', marginBottom: 8, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, #10b981, #00e5ff)', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 14 }}>
                                        <span style={{ color: 'var(--text-2)' }}>₹{Number(g.current_amount).toFixed(0)} saved</span>
                                        <span style={{ color: '#10b981', fontWeight: 800 }}>{pct}%</span>
                                    </div>
                                    {!complete && (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input value={deposit[g.id] || ''} onChange={e => setDeposit(d => ({ ...d, [g.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addDeposit(g)} placeholder="Add ₹" type="number" className="app-input" style={{ flex: 1 }} />
                                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={() => addDeposit(g)}
                                                style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                                                + Add
                                            </motion.button>
                                        </div>
                                    )}
                                    {complete && (
                                        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, fontSize: 13, color: '#10b981', fontWeight: 700 }}>
                                            🎉 Goal achieved!
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AIFinanceAdvisor({ userId }) {
    const [q, setQ] = useState('');
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('ai_history').select('response').eq('user_id', userId).eq('module', 'finance').order('created_at', { ascending: false }).limit(1).single()
            .then(({ data }) => { if (data) setAdvice(data.response); });
    }, [userId]);

    const generate = async () => {
        if (!q.trim()) return;
        setLoading(true); setAdvice('');
        const { data: txs } = await supabase.from('transactions').select('amount,type,category').eq('user_id', userId).limit(20);
        const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const ctx = txs?.length ? `Financial snapshot: ₹{income.toFixed(0)} income, ₹{expense.toFixed(0)} expenses, net ₹{(income - expense).toFixed(0)}.` : 'No transaction data yet.';
        const { text, error } = await callGemini(`${ctx}\n\nQuestion: "${q}"`, SYSTEM_PROMPTS.finance);
        if (!error && text) {
            setAdvice(text);
            await supabase.from('ai_history').insert({
                user_id: userId,
                module: 'finance',
                prompt: q,
                response: text
            });
        } else {
            setAdvice(error ? `⚠️ ${error}` : '');
        }
        setLoading(false);
    };

    const prompts = ['How should I build an emergency fund?', 'Help me create a savings plan', 'Am I spending too much?', 'Best ways to reduce monthly expenses'];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card>
                <div style={{ fontSize: 36, marginBottom: 14, filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' }}>💰</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>AI Financial Advisor</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>Get personalised financial advice based on your real spending and savings data.</p>
                <textarea value={q} onChange={e => setQ(e.target.value)} placeholder="Ask a financial question..." rows={4} className="app-input" style={{ resize: 'vertical', lineHeight: 1.7, marginBottom: 16 }} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generate} disabled={loading || !q.trim()}
                    style={{ padding: '13px', width: '100%', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#00e5ff)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: q.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: loading || !q.trim() ? 0.6 : 1, boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                    {loading ? <><Spinner /> Analysing...</> : <><FiZap /> Get Advice</>}
                </motion.button>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Quick prompts</div>
                    {prompts.map((p, i) => (
                        <motion.button key={i} onClick={() => setQ(p)} whileHover={{ x: 4 }}
                            style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.18s' }}>
                            💡 {p}
                        </motion.button>
                    ))}
                </div>
            </Card>
            <Card>
                {advice ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💡</div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial Advice</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{advice}</div>
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40, opacity: 0.45 }}>
                        <span style={{ fontSize: 52, marginBottom: 16 }}>📊</span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Your advice will appear here</div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Ask a question on the left</div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function Subscriptions({ userId }) {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', amount: '', billing_cycle: 'monthly', category: 'Other', next_billing: new Date().toISOString().split('T')[0] });

    const fetchSubs = useCallback(() => {
        supabase.from('subscriptions').select('*').eq('user_id', userId).order('next_billing')
            .then(({ data }) => { setSubs(data || []); setLoading(false); });
    }, [userId]);

    useEffect(() => { fetchSubs(); }, [fetchSubs]);
    useRealtimeRefresh('subscriptions', userId, fetchSubs);

    const addSub = async () => {
        if (!form.name.trim() || !form.amount) return;
        const { data, error } = await supabase.from('subscriptions').insert({ user_id: userId, ...form, amount: parseFloat(form.amount) }).select().single();
        if (!error && data) setSubs(s => [...s, data]);
        setForm({ name: '', amount: '', billing_cycle: 'monthly', category: 'Other', next_billing: new Date().toISOString().split('T')[0] }); setAdding(false);
    };

    const delSub = async (id) => {
        await supabase.from('subscriptions').delete().eq('id', id);
        setSubs(ss => ss.filter(s => s.id !== id));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>;

    const totalMonthly = subs.reduce((acc, s) => acc + (s.billing_cycle === 'yearly' ? s.amount / 12 : s.amount), 0);

    return (
        <div>
            <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg,rgba(124,58,237,0.05),rgba(0,229,255,0.03))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Monthly Subscriptions Total</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Estimated average across all cycles</div>
                    </div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 24, fontWeight: 900, color: '#00e5ff' }}>
                        ${totalMonthly.toFixed(2)}
                    </div>
                </div>
            </Card>

            <div style={{ marginBottom: 18 }}>
                {!adding ? (
                    <button onClick={() => setAdding(true)} className="btn-add"><FiPlus size={14} /> Add Subscription</button>
                ) : (
                    <Card style={{ padding: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Subscription name" className="app-input" />
                            <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Amount $" type="number" className="app-input" />
                            <select value={form.billing_cycle} onChange={e => setForm({ ...form, billing_cycle: e.target.value })} className="app-select">
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="app-select">
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <input type="date" value={form.next_billing} onChange={e => setForm({ ...form, next_billing: e.target.value })} className="app-input" style={{ colorScheme: 'dark' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={addSub} className="btn-save">Save</button>
                            <button onClick={() => setAdding(false)} className="btn-cancel"><FiX size={14} /></button>
                        </div>
                    </Card>
                )}
            </div>

            {!subs.length ? <FinanceEmptyState icon="🗓️" title="No subscriptions" desc="Track your recurring payments here." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {subs.map(s => (
                        <Card key={s.id} style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                        {CAT_ICONS[s.category] || '📦'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{s.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Next billing: {s.next_billing}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>${Number(s.amount).toFixed(2)}</div>
                                        <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>{s.billing_cycle}</div>
                                    </div>
                                    <button onClick={() => delSub(s.id)} className="btn-danger"><FiTrash2 size={13} /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

const FinanceEmptyState = ({ icon, title, desc }) => (
    <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{desc}</div>
    </div>
);
