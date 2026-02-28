import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Call Gemini with a prompt and optional system instruction.
 * Returns { text: string, error: string|null }
 */
export async function callGemini(prompt, systemInstruction = '') {
    try {
        const client = getClient();
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            ...(systemInstruction ? { systemInstruction } : {}),
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown bolding if present
        const cleanText = text.replace(/\*\*/g, '');
        return { text: cleanText, error: null };
    } catch (err) {
        console.error('[aiService] Gemini error:', err);
        return { text: '', error: err.message || 'AI request failed. Please try again.' };
    }
}

/* ─── Domain-specific helpers ─────────────────────────────── */

export async function generateCareerRoadmap({ currentRole, targetRole, industry, currentSkills, targetSkills, timeline }) {
    const prompt = `You are an elite career strategist. Generate a structured career roadmap as JSON (no markdown, raw JSON only).

User Profile:
- Current Role: ${currentRole}
- Target Role: ${targetRole}
- Industry: ${industry}
- Current Skills: ${currentSkills.join(', ')}
- Skills to Learn: ${targetSkills.join(', ')}
- Timeline: ${timeline}

Return exactly this JSON structure:
{
  "summary": "2-sentence career vision statement",
  "milestones": [
    {
      "title": "milestone title",
      "deadline": "Month YYYY",
      "description": "1-sentence description",
      "color": "#hexcolor"
    }
  ],
  "skillGaps": ["skill gap 1", "skill gap 2"],
  "quickWin": "One thing to do this week"
}

Generate 4-6 milestones. Use varied hex colors from: #7c3aed, #00f5ff, #f59e0b, #10b981, #ec4899, #f97316.`;

    const { text, error } = await callGemini(prompt);
    if (error) return { data: null, error };
    try {
        const clean = text.replace(/```json|```/g, '').trim();
        return { data: JSON.parse(clean), error: null };
    } catch {
        return { data: null, error: 'Could not parse AI roadmap. Please try again.' };
    }
}

export async function generateInterviewQuestions(targetRole) {
    const prompt = `Generate 6 interview questions for a ${targetRole} candidate. Return raw JSON only, no markdown.

[
  { "q": "question text", "category": "Behavioral|Technical|System Design", "difficulty": "Easy|Medium|Hard" }
]`;

    const { text, error } = await callGemini(prompt);
    if (error) return { data: null, error };
    try {
        const clean = text.replace(/```json|```/g, '').trim();
        return { data: JSON.parse(clean), error: null };
    } catch {
        return { data: null, error: 'Could not parse questions.' };
    }
}

export const SYSTEM_PROMPTS = {
    career: 'You are PriMaX Hub\'s AI Career Strategist. Give specific, actionable, data-driven career advice. Use headers, bullets, and emojis. DO NOT use markdown bolding (double asterisks **). Keep responses under 400 words.',
    finance: 'You are PriMaX Hub\'s AI Financial Advisor. Give practical, conservative financial advice. Use specific numbers and percentages where helpful. DO NOT use markdown bolding (double asterisks **). Keep responses under 350 words.',
    fitness: 'You are PriMaX Hub\'s AI Fitness Coach with deep sports science knowledge. Give safe, effective, evidence-based fitness guidance. DO NOT use markdown bolding (double asterisks **). Keep responses under 350 words.',
    mental: 'You are PriMaX Hub\'s AI Mindset Coach trained in positive psychology and CBT. Be empathetic, warm and practical. DO NOT use markdown bolding (double asterisks **). Keep responses under 350 words.',
    productivity: 'You are PriMaX Hub\'s AI Productivity Coach. Give focused, specific system-based advice. DO NOT use markdown bolding (double asterisks **). Keep responses under 300 words.',
    global: 'You are PriMaX Hub, an elite AI personal growth assistant. You have context across Career, Finance, Fitness, and Mental Growth domains. Be concise, smart, and action-oriented. DO NOT use markdown bolding (double asterisks **).',
};
