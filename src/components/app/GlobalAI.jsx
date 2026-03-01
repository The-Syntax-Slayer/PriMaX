import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiZap, FiChevronRight, FiMaximize2, FiMinimize2, FiCheckCircle, FiSettings, FiActivity, FiTrash2, FiCommand } from 'react-icons/fi';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

            ctx.fillStyle = '#10b981'; // Matrix green
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
                opacity: 0.15,
                zIndex: 0
            }}
        />
    );
};

export default function GlobalAI() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [msgs, setMsgs] = useState([
        { role: 'ai', text: 'System Online. I am PriMaX Agent — your autonomous core intelligence. I can create tasks, log finances, track workouts, and control the Hub. Give me a command.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentAction, setAgentAction] = useState(null);
    const [chatInstance, setChatInstance] = useState(null);
    const [showCommands, setShowCommands] = useState(false);
    const chatEndRef = useRef(null);
    const commandsRef = useRef(null);

    // ── AGENT TOOLS (FUNCTION DECLARATIONS) ──
    const agentTools = {
        functionDeclarations: [
            {
                name: "create_task",
                description: "Create a new task in the Productivity module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "Title of the task" },
                        priority: { type: SchemaType.STRING, description: "Priority level (high, medium, low). Default is medium." }
                    },
                    required: ["title"]
                }
            },
            {
                name: "add_transaction",
                description: "Log an expense or income in the Finance module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        description: { type: SchemaType.STRING, description: "Description or name of the transaction (e.g. Lunch at Chipotle)" },
                        amount: { type: SchemaType.NUMBER, description: "Amount of the transaction" },
                        type: { type: SchemaType.STRING, description: "Transaction type: 'expense' or 'income'" },
                        category: { type: SchemaType.STRING, description: "Category string, e.g., Food & Drink, Transport, Housing, etc." }
                    },
                    required: ["description", "amount", "type", "category"]
                }
            },
            {
                name: "log_workout",
                description: "Log a completed workout in the Fitness module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Name of the workout or exercise" },
                        type: { type: SchemaType.STRING, description: "Type of workout, e.g., Cardio, Strength, Flexibility" },
                        duration_minutes: { type: SchemaType.NUMBER, description: "Duration in minutes" }
                    },
                    required: ["name", "type", "duration_minutes"]
                }
            },
            {
                name: "add_journal_entry",
                description: "Add a new journal entry in the Mental Growth module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "Title of the journal entry" },
                        content: { type: SchemaType.STRING, description: "The content of the journal entry" }
                    },
                    required: ["title", "content"]
                }
            },
            {
                name: "log_mood",
                description: "Log the user's current mood in the Mental Growth module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        mood_value: { type: SchemaType.STRING, description: "Mood value (e.g., Great, Good, Okay, Bad, Awful)" },
                        note: { type: SchemaType.STRING, description: "Optional note about why they feel this way" }
                    },
                    required: ["mood_value"]
                }
            },
            {
                name: "add_job_application",
                description: "Track a new job application in the Career module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        company: { type: SchemaType.STRING, description: "Company name" },
                        job_role: { type: SchemaType.STRING, description: "Job title or role" },
                        salary: { type: SchemaType.STRING, description: "Expected salary, if known" }
                    },
                    required: ["company", "job_role"]
                }
            },
            {
                name: "create_goal",
                description: "Create a new savings goal in the Finance module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Goal name (e.g. New Car)" },
                        target_amount: { type: SchemaType.NUMBER, description: "Amount needed" }
                    },
                    required: ["name", "target_amount"]
                }
            },
            {
                name: "add_learning_item",
                description: "Add a skill or topic to the Learning module.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "Name of the skill (e.g. React.js)" },
                        category: { type: SchemaType.STRING, description: "Category (e.g. Development, Language)" },
                        priority: { type: SchemaType.STRING, description: "Priority level (High, Medium, Low)" }
                    },
                    required: ["title", "category"]
                }
            },
            {
                name: "get_data",
                description: "Fetch all user data from a specific module. Use this to read the user's current items (e.g. read their tasks).",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        table_name: { type: SchemaType.STRING, description: "One of: tasks, habits, goals, transactions, workouts, journal_entries, mood_logs, job_applications, learning_items, life_admin, social_contacts, decisions, simulations, time_logs, risks" }
                    },
                    required: ["table_name"]
                }
            },
            {
                name: "delete_all_data",
                description: "Delete ALL user data from a specific module. USE WITH CAUTION. Example: clearing all tasks.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        table_name: { type: SchemaType.STRING, description: "One of: tasks, habits, goals, transactions, workouts, journal_entries, mood_logs, job_applications, learning_items, life_admin, social_contacts, decisions, simulations, time_logs, risks" }
                    },
                    required: ["table_name"]
                }
            },
            {
                name: "delete_item",
                description: "Delete a specific item from a module by matching a column value. (e.g. matching task title).",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        table_name: { type: SchemaType.STRING, description: "The table name" },
                        column_name: { type: SchemaType.STRING, description: "The column to match against (e.g., 'title', 'description', 'name', 'company')" },
                        match_value: { type: SchemaType.STRING, description: "The value to search for and delete (e.g. 'Buy groceries')" }
                    },
                    required: ["table_name", "column_name", "match_value"]
                }
            },
            {
                name: "update_item",
                description: "Update a specific item in a module. E.g. marking a task as 'completed'. To update a generic task, use table_name 'tasks', match_column 'title', match_value 'X', update_column 'status', update_value 'completed'.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        table_name: { type: SchemaType.STRING },
                        match_column: { type: SchemaType.STRING, description: "Column to identify the item (e.g. 'title')" },
                        match_value: { type: SchemaType.STRING, description: "Value to match (e.g. 'Read a book')" },
                        update_column: { type: SchemaType.STRING, description: "Column to update (e.g. 'status')" },
                        update_value: { type: SchemaType.STRING, description: "New value (e.g. 'completed')" }
                    },
                    required: ["table_name", "match_column", "match_value", "update_column", "update_value"]
                }
            }
        ]
    };

    const SYSTEM_PROMPT = `You are the PriMaX Hub Global AI Agent, an elite autonomous personal assistant. 
You are embedded inside a life OS spanning Productivity, Career, Finance, Fitness, and Mental Growth.
You don't just chat—you TAKE ACTION. When a user asks you to do something (create a task, log an expense, add a journal, etc.), ALWAYS use the provided tools to execute the action in the database.
If a user's request is ambiguous, ask for clarification. If it matches a tool, USE THE TOOL.
Do not use markdown bolding (**) in your responses. Be concise and confirm actions.`;

    // ── INITIALIZE CHAT INSTANCE ──
    const initChat = async () => {
        if (!user) return null;
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            tools: [agentTools] // Inject Tools
        });

        // Fetch recent context (max 10) to keep token size manageable
        const { data } = await supabase
            .from('ai_history')
            .select('prompt, response')
            .eq('user_id', user.id)
            .eq('module', 'global_agent')
            .order('created_at', { ascending: false })
            .limit(10);

        const history = [];
        if (data && data.length > 0) {
            data.reverse().forEach(d => {
                history.push({ role: 'user', parts: [{ text: d.prompt }] });
                history.push({ role: 'model', parts: [{ text: d.response }] });
            });
        }

        return model.startChat({ history });
    };

    useEffect(() => {
        if (user && !chatInstance) {
            initChat().then(setChatInstance);
        }
    }, [user, chatInstance]);

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, isOpen, agentAction]);

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

    // Close commands menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commandsRef.current && !commandsRef.current.contains(event.target)) {
                setShowCommands(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── COMMAND LIST ──
    const agentCommands = [
        { cmd: '/task', desc: 'Create a new task', example: '/task Finish the quarterly report' },
        { cmd: '/spend', desc: 'Log an expense', example: '/spend Lunch at Chipotle $15' },
        { cmd: '/income', desc: 'Log income', example: '/income Client payment $500' },
        { cmd: '/workout', desc: 'Log a workout', example: '/workout 30m of running' },
        { cmd: '/journal', desc: 'Add a journal entry', example: '/journal Feeling great today because...' },
        { cmd: '/mood', desc: 'Log your mood', example: '/mood Great' },
        { cmd: '/job', desc: 'Track a job application', example: '/job Applied to Google for SWE role' },
        { cmd: '/goal', desc: 'Create a savings goal', example: '/goal Save $5000 for a car' },
        { cmd: '/learn', desc: 'Add a learning topic', example: '/learn Start learning Python' },
        { cmd: '/update', desc: 'Update any item', example: '/update my task "Buy groceries" to completed' }
    ];

    const handleCommandClick = (cmdItem) => {
        setInput(cmdItem.example);
        setShowCommands(false);
    };

    // ── TOOL EXECUTION LOGIC ──
    const executeToolCall = async (call) => {
        setAgentAction(`Executing: ${call.name.replace(/_/g, ' ')}...`);
        let actionResult = {};
        let actionMsg = "";

        try {
            switch (call.name) {
                case 'create_task': {
                    const { title, priority } = call.args;
                    const { error } = await supabase.from('tasks').insert({
                        user_id: user.id, title, priority: priority || 'medium', status: 'todo'
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Task '${title}' created.` };
                    actionMsg = `Created Task: ${title}`;
                    break;
                }
                case 'add_transaction': {
                    const { description, amount, type, category } = call.args;
                    const { error } = await supabase.from('transactions').insert({
                        user_id: user.id, description, amount, type, category, date: new Date().toISOString()
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Transaction of ${amount} logged as ${type}.` };
                    actionMsg = `Logged ${type}: $${amount} (${description})`;
                    break;
                }
                case 'log_workout': {
                    const { name, type, duration_minutes } = call.args;
                    const { error } = await supabase.from('workouts').insert({
                        user_id: user.id, name, type, duration_minutes: duration_minutes || null
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Workout '${name}' logged.` };
                    actionMsg = `Logged Workout: ${name} (${duration_minutes}m)`;
                    break;
                }
                case 'add_journal_entry': {
                    const { title, content } = call.args;
                    const { error } = await supabase.from('journal_entries').insert({
                        user_id: user.id, title, content
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Journal entry '${title}' saved.` };
                    actionMsg = `Saved Journal: ${title}`;
                    break;
                }
                case 'log_mood': {
                    const { mood_value, note } = call.args;
                    const { error } = await supabase.from('mood_logs').insert({
                        user_id: user.id, mood_value, note: note || null
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Mood '${mood_value}' logged.` };
                    actionMsg = `Logged Mood: ${mood_value}`;
                    break;
                }
                case 'add_job_application': {
                    const { company, job_role, salary } = call.args;
                    const { error } = await supabase.from('job_applications').insert({
                        user_id: user.id, company, job_role, salary: salary || '', status: 'Applied', color: '#7c3aed'
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Application to '${company}' logged.` };
                    actionMsg = `Added Job Application: ${company} - ${job_role}`;
                    break;
                }
                case 'create_goal': {
                    const { name, target_amount } = call.args;
                    const { error } = await supabase.from('goals').insert({
                        user_id: user.id, name, target_amount, current_amount: 0
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Goal '${name}' created for $${target_amount}.` };
                    actionMsg = `Created Goal: ${name.substring(0, 20)}`;
                    break;
                }
                case 'add_learning_item': {
                    const { title, category, priority } = call.args;
                    const { error } = await supabase.from('learning_items').insert({
                        user_id: user.id, title, category, priority: priority || 'Medium', status: 'Not Started', progress: 0
                    });
                    if (error) throw error;
                    actionResult = { success: true, message: `Learning item '${title}' added.` };
                    actionMsg = `Added to Learning: ${title.substring(0, 20)}`;
                    break;
                }
                case 'get_data': {
                    const { table_name } = call.args;
                    const { data, error } = await supabase.from(table_name).select('*').eq('user_id', user.id).limit(50);
                    if (error) throw error;
                    actionResult = { success: true, count: data.length, data: data };
                    actionMsg = `Read data from: ${table_name}`;
                    break;
                }
                case 'delete_all_data': {
                    const { table_name } = call.args;
                    // Supabase requires eq on delete. We always eq user_id
                    const { error } = await supabase.from(table_name).delete().eq('user_id', user.id);
                    if (error) throw error;
                    actionResult = { success: true, message: `All data in ${table_name} deleted successfully.` };
                    actionMsg = `Cleared all data in: ${table_name}`;
                    break;
                }
                case 'delete_item': {
                    const { table_name, column_name, match_value } = call.args;
                    const { error } = await supabase.from(table_name).delete().eq('user_id', user.id).ilike(column_name, `%${match_value}%`);
                    if (error) throw error;
                    actionResult = { success: true, message: `Deleted item where ${column_name} matches '${match_value}'.` };
                    actionMsg = `Deleted from ${table_name}: ${match_value}`;
                    break;
                }
                case 'update_item': {
                    const { table_name, match_column, match_value, update_column, update_value } = call.args;
                    const updateObj = {};
                    updateObj[update_column] = update_value;
                    const { error } = await supabase.from(table_name).update(updateObj).eq('user_id', user.id).ilike(match_column, `%${match_value}%`);
                    if (error) throw error;
                    actionResult = { success: true, message: `Updated item where ${match_column} matching '${match_value}'. Set ${update_column} to '${update_value}'.` };
                    actionMsg = `Updated ${table_name}: ${match_value} -> ${update_value}`;
                    break;
                }
                default:
                    actionResult = { error: `Unknown function ${call.name}` };
            }

            if (actionMsg) {
                setMsgs(p => [...p, { type: 'action', text: actionMsg }]);
            }
        } catch (e) {
            console.error("Tool execution error:", e);
            actionResult = { error: e.message };
        }

        return {
            functionResponse: {
                name: call.name,
                response: actionResult
            }
        };
    };

    const send = async () => {
        if (!input.trim() || loading || !chatInstance) return;
        const userTxt = input.trim();
        setInput('');
        setMsgs((p) => [...p, { role: 'user', text: userTxt }]);
        setLoading(true);

        try {
            let result = await chatInstance.sendMessage(userTxt);
            let aiTxt = "";
            let callsCount = 0;

            // Handle multiple potential tool calls
            while (result.response.functionCalls()) {
                callsCount++;
                const calls = result.response.functionCalls();
                const functionResponses = [];

                for (const call of calls) {
                    const funcRes = await executeToolCall(call);
                    functionResponses.push(funcRes);
                }

                // Send results back to the model
                setAgentAction("Processing results...");
                result = await chatInstance.sendMessage(functionResponses);

                // Absolute maximum loop breaker to prevent infinite calls
                if (callsCount > 7) break;
            }

            try {
                aiTxt = result.response.text();
                aiTxt = aiTxt.replace(/\*\*/g, ''); // Clean output
            } catch (textErr) {
                // If the model only called functions and returned no text
                aiTxt = "I've completed those actions for you.";
            }

            if (aiTxt) {
                setMsgs((p) => [...p, { role: 'ai', text: aiTxt }]);

                // Persist full exchange to DB
                if (user) {
                    await supabase.from('ai_history').insert({
                        user_id: user.id,
                        module: 'global_agent',
                        prompt: userTxt,
                        response: aiTxt
                    });
                }
            }
        } catch (e) {
            console.error("Agent chat error:", e);
            setMsgs((p) => [...p, { role: 'ai', text: `⚠️ Neural Sync Error: ${e.message || 'Request failed'}` }]);
            // Re-init chat instance if it crashes or drops context
            initChat().then(setChatInstance);
        } finally {
            setLoading(false);
            setAgentAction(null);
        }
    };

    const clearChat = async () => {
        // Reset local msgs
        setMsgs([
            { role: 'ai', text: 'System Online. I am PriMaX Agent — your autonomous core intelligence. I can create tasks, log finances, track workouts, and control the Hub. Give me a command.' }
        ]);

        // Clear history from DB
        if (user) {
            await supabase.from('ai_history').delete().eq('user_id', user.id).eq('module', 'global_agent');
        }

        // Restart chat instance to clear model's internal history
        initChat().then(setChatInstance);
    };

    // Generate dynamic suggestions based on recent history
    const getSuggestions = () => {
        const defaultSuggestions = [
            'Create a task to finish my project',
            'Log a $15 food expense for lunch',
            'Plan my day for productivity',
            'Record a 30m cardio workout',
            'I am feeling great today.',
            'Add a job application for Google SWE'
        ];

        // Randomize 4 suggestions
        return defaultSuggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
    };

    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        // Only generate new suggestions when chat opens or history loads
        if (isOpen && msgs.length <= 1) {
            setSuggestions(getSuggestions());
        }
    }, [isOpen, msgs.length]);

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
                        position: 'fixed', bottom: 24, right: 24,
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #00e5ff)',
                        border: 'none', color: '#04020a', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.4), inset 0 0 10px rgba(255,255,255,0.5)',
                        cursor: 'pointer', zIndex: 9999,
                    }}
                >
                    <FiActivity size={28} />
                    <motion.div
                        animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)' }}
                    />
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }}
                        style={{
                            position: 'fixed',
                            bottom: isExpanded ? 24 : 24,
                            right: isExpanded ? 24 : 24,
                            width: isExpanded ? 'calc(100vw - 48px)' : 420,
                            height: isExpanded ? 'calc(100vh - 48px)' : 650,
                            maxWidth: isExpanded ? 1400 : '100%',
                            borderRadius: 24,
                            background: 'rgba(6, 4, 20, 0.85)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 100px rgba(16,185,129,0.1)',
                            display: 'flex', flexDirection: 'column',
                            zIndex: 10000, overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04020a', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                                    <FiActivity size={22} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '0.02em' }}>Autonomous Agent</div>
                                    <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                        System Control Active
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={clearChat} style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: 8 }} title="Clear Chat History">
                                    <FiTrash2 size={16} />
                                </button>
                                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: 8 }} title={isExpanded ? 'Minimize' : 'Maximize'}>
                                    {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: 8 }} title="Close (⌘J)">
                                    <FiX size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area with Matrix Background */}
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <MatrixRain />
                            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1 }} className="no-scrollbar">
                                {msgs.map((m, i) => {
                                    if (m.type === 'action') {
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                key={i} style={{ alignSelf: 'flex-start', marginLeft: 44, margin: '2px 0', padding: '8px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '3px solid #10b981', color: '#10b981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
                                            >
                                                <FiCheckCircle size={15} />
                                                {m.text}
                                            </motion.div>
                                        );
                                    }

                                    return (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                                                {m.role === 'ai' && <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #00e5ff)', color: '#04020a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4, boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}><FiActivity size={16} /></div>}
                                                <div style={{
                                                    padding: '14px 18px',
                                                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                                                    background: m.role === 'user' ? 'linear-gradient(135deg, rgba(16,185,129,0.6), rgba(0,229,255,0.4))' : 'rgba(255,255,255,0.05)',
                                                    border: m.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.08)',
                                                    color: 'white', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                                                    boxShadow: m.role === 'user' ? '0 10px 25px rgba(0,0,0,0.2)' : 'none',
                                                }}>
                                                    {m.text}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {agentAction && (
                                    <div style={{ alignSelf: 'flex-start', marginLeft: 44, padding: '6px 14px', borderRadius: 12, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderLeft: '3px solid #00e5ff', color: '#00e5ff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><FiSettings size={14} /></motion.div>
                                        {agentAction}
                                    </div>
                                )}

                                {loading && !agentAction && (
                                    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #00e5ff)', color: '#04020a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4, boxShadow: '0 0 15px rgba(16,185,129,0.3)', opacity: 0.7 }}><FiActivity size={16} /></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 20px', borderRadius: '4px 20px 20px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                                            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff' }} />
                                            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 10 }}>

                            {/* Commands Popover */}
                            <AnimatePresence>
                                {showCommands && (
                                    <motion.div
                                        ref={commandsRef}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 20,
                                            right: 20,
                                            marginBottom: 10,
                                            background: 'rgba(13, 11, 28, 0.95)',
                                            backdropFilter: 'blur(15px)',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            borderRadius: 16,
                                            padding: 12,
                                            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                            zIndex: 20,
                                            maxHeight: 250,
                                            overflowY: 'auto'
                                        }}
                                        className="no-scrollbar"
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 8 }}>Available Commands</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {agentCommands.map((c, i) => (
                                                <motion.button
                                                    key={i}
                                                    whileHover={{ background: 'rgba(16,185,129,0.1)' }}
                                                    onClick={() => handleCommandClick(c)}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                                        padding: '10px 12px', borderRadius: 10, background: 'transparent',
                                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <span style={{ color: '#10b981', fontWeight: 800, fontSize: 13 }}>{c.cmd}</span>
                                                        <span style={{ color: 'var(--text-1)', fontSize: 13 }}>{c.desc}</span>
                                                    </div>
                                                    <div style={{ color: 'var(--text-3)', fontSize: 12 }}>e.g., {c.example}</div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {msgs.length === 1 && suggestions.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => setInput(s)} style={{ padding: '8px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }} className="hover-bg-glass">{s}</button>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', padding: '12px 16px', borderRadius: 20, boxShadow: input ? '0 0 20px rgba(16,185,129,0.15)' : 'inset 0 2px 10px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: '#10b981' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowCommands(!showCommands)}
                                    style={{
                                        background: 'none', border: 'none', color: showCommands ? '#10b981' : 'var(--text-3)',
                                        cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 4, transition: 'color 0.2s'
                                    }}
                                    title="Show Commands"
                                >
                                    <FiCommand size={20} />
                                </motion.button>

                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                    placeholder="Command the Hub... (or click the command icon)"
                                    rows={Math.min(4, input.split('\n').length)}
                                    style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 15, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', padding: '4px 0', maxHeight: 150, lineHeight: 1.6 }}
                                />

                                <motion.button
                                    whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={send}
                                    disabled={!input.trim() || loading}
                                    style={{ width: 44, height: 44, borderRadius: 14, background: input.trim() && !loading ? 'linear-gradient(135deg, #10b981, #00e5ff)' : 'rgba(255,255,255,0.1)', border: 'none', color: input.trim() && !loading ? '#04020a' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.3s' }}
                                >
                                    <FiSend size={20} style={{ marginLeft: -2, marginTop: 2 }} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
