import { supabase } from './supabase';

/**
 * PriMaX Hub — Professional Presentation Mode
 * Injects realistic, high-quality demo data for every module component.
 * 
 * Persona: "Alex Rivera" — Senior Full-Stack Engineer targeting Staff Engineer
 * Context: Data reflects a high-performing professional in week 3 of using PriMaX Hub.
 */
export const injectMockData = async (userId) => {
    if (!userId) return { error: 'No user ID provided' };

    const now = new Date();
    const d = (daysAgo) => {
        const dt = new Date(now);
        dt.setDate(dt.getDate() - daysAgo);
        return dt.toISOString().split('T')[0];
    };
    const ts = (daysAgo, hour = 9, min = 0) => {
        const dt = new Date(now);
        dt.setDate(dt.getDate() - daysAgo);
        dt.setHours(hour, min, 0, 0);
        return dt.toISOString();
    };
    const nextBill = (daysFromNow) => {
        const dt = new Date(now);
        dt.setDate(dt.getDate() + daysFromNow);
        return dt.toISOString().split('T')[0];
    };

    try {
        // ══════════════════════════════════════════════════
        // MODULE 1: PRODUCTIVITY — Tasks (Kanban Board)
        // ══════════════════════════════════════════════════
        await supabase.from('tasks').insert([
            {
                user_id: userId,
                title: 'Architect microservices auth layer for V2 platform',
                status: 'inprogress',
                priority: 'high',
                due_date: d(1),
            },
            {
                user_id: userId,
                title: 'Write technical spec for new data pipeline',
                status: 'inprogress',
                priority: 'high',
                due_date: d(0),
            },
            {
                user_id: userId,
                title: 'Code review: payment gateway PR #214',
                status: 'inprogress',
                priority: 'medium',
                due_date: d(0),
            },
            {
                user_id: userId,
                title: 'Prepare sprint retrospective slides',
                status: 'todo',
                priority: 'medium',
                due_date: d(-2),
            },
            {
                user_id: userId,
                title: 'Update API documentation for v2.1 endpoints',
                status: 'todo',
                priority: 'medium',
                due_date: d(-3),
            },
            {
                user_id: userId,
                title: 'Research system design patterns for distributed caching',
                status: 'todo',
                priority: 'low',
                due_date: d(-5),
            },
            {
                user_id: userId,
                title: 'Fix performance regression in search query (N+1 issue)',
                status: 'todo',
                priority: 'high',
                due_date: d(1),
            },
            {
                user_id: userId,
                title: 'Complete onboarding checklist for new team member',
                status: 'done',
                priority: 'medium',
                due_date: d(3),
            },
            {
                user_id: userId,
                title: 'Deploy staging environment for Q2 release candidate',
                status: 'done',
                priority: 'high',
                due_date: d(4),
            },
            {
                user_id: userId,
                title: 'Refactor authentication middleware to use JWT refresh tokens',
                status: 'done',
                priority: 'high',
                due_date: d(6),
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 1: PRODUCTIVITY — Habits
        // ══════════════════════════════════════════════════
        await supabase.from('habits').insert([
            {
                user_id: userId,
                name: 'Deep Work Session (90 min, no interruptions)',
                module: 'productivity',
                streak: 21,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5), d(6)],
            },
            {
                user_id: userId,
                name: 'Daily planning — review tasks & set top 3 priorities',
                module: 'productivity',
                streak: 14,
                completions: [d(0), d(1), d(2), d(3), d(4)],
            },
            {
                user_id: userId,
                name: 'Read 30 min — engineering books / papers',
                module: 'productivity',
                streak: 30,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5), d(6), d(7)],
            },
            {
                user_id: userId,
                name: 'No screen time after 10:30 PM',
                module: 'productivity',
                streak: 8,
                completions: [d(0), d(1), d(2)],
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 1: PRODUCTIVITY — Focus Sessions
        // ══════════════════════════════════════════════════
        await supabase.from('focus_sessions').insert([
            { user_id: userId, duration_minutes: 90, mode: 'focus', completed_at: ts(0, 9, 30) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(0, 11, 0) },
            { user_id: userId, duration_minutes: 25, mode: 'short_break', completed_at: ts(0, 11, 30) },
            { user_id: userId, duration_minutes: 90, mode: 'focus', completed_at: ts(1, 8, 45) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(1, 14, 0) },
            { user_id: userId, duration_minutes: 50, mode: 'focus', completed_at: ts(2, 9, 0) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(2, 15, 0) },
            { user_id: userId, duration_minutes: 90, mode: 'focus', completed_at: ts(3, 10, 0) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(4, 9, 0) },
            { user_id: userId, duration_minutes: 90, mode: 'focus', completed_at: ts(5, 8, 30) },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 2: FITNESS — Workouts
        // ══════════════════════════════════════════════════
        await supabase.from('workouts').insert([
            {
                user_id: userId,
                name: 'Upper Body Hypertrophy — Push Focus',
                type: 'Strength',
                duration_minutes: 65,
                completed_at: ts(0, 6, 30),
            },
            {
                user_id: userId,
                name: 'Zone 2 Aerobic — Steady State Run',
                type: 'Cardio',
                duration_minutes: 45,
                completed_at: ts(1, 7, 0),
            },
            {
                user_id: userId,
                name: 'Lower Body Power — Squat & Deadlift',
                type: 'Strength',
                duration_minutes: 70,
                completed_at: ts(2, 6, 45),
            },
            {
                user_id: userId,
                name: 'HIIT Intervals — 8 x 30s Sprints',
                type: 'HIIT',
                duration_minutes: 30,
                completed_at: ts(3, 6, 30),
            },
            {
                user_id: userId,
                name: 'Yoga Flow & Mobility Work',
                type: 'Yoga',
                duration_minutes: 50,
                completed_at: ts(4, 7, 0),
            },
            {
                user_id: userId,
                name: 'Full Body Compound Lifts',
                type: 'Strength',
                duration_minutes: 75,
                completed_at: ts(5, 6, 30),
            },
            {
                user_id: userId,
                name: 'Long Endurance Cycle — Riverside Route',
                type: 'Cycling',
                duration_minutes: 90,
                completed_at: ts(6, 8, 0),
            },
            {
                user_id: userId,
                name: 'Pull Day — Back, Biceps & Rear Delts',
                type: 'Strength',
                duration_minutes: 60,
                completed_at: ts(7, 6, 45),
            },
            {
                user_id: userId,
                name: '10K Easy Pace Run',
                type: 'Running',
                duration_minutes: 55,
                completed_at: ts(9, 7, 0),
            },
            {
                user_id: userId,
                name: 'Tabata Circuit — Core & Conditioning',
                type: 'HIIT',
                duration_minutes: 25,
                completed_at: ts(10, 6, 30),
            },
        ]);

        // Fitness Habits
        await supabase.from('habits').insert([
            {
                user_id: userId,
                name: '10,000+ Steps Daily',
                module: 'fitness',
                streak: 12,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5)],
            },
            {
                user_id: userId,
                name: 'Train before 8AM',
                module: 'fitness',
                streak: 18,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5), d(6)],
            },
            {
                user_id: userId,
                name: 'Protein intake target — 180g daily',
                module: 'fitness',
                streak: 5,
                completions: [d(0), d(1), d(2)],
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 3: FINANCE — Transactions (realistic spread)
        // ══════════════════════════════════════════════════
        await supabase.from('transactions').insert([
            // Income
            {
                user_id: userId,
                description: 'Monthly Salary — TechCorp Inc.',
                amount: 7500,
                type: 'income',
                category: 'Other',
                date: d(3),
            },
            {
                user_id: userId,
                description: 'Freelance Contract — API Integration (Acme Labs)',
                amount: 2800,
                type: 'income',
                category: 'Other',
                date: d(8),
            },
            {
                user_id: userId,
                description: 'Teaching Assistant — Udemy Course Revenue',
                amount: 340,
                type: 'income',
                category: 'Other',
                date: d(12),
            },
            {
                user_id: userId,
                description: 'GitHub Sponsors — Open Source Contribution',
                amount: 180,
                type: 'income',
                category: 'Other',
                date: d(15),
            },

            // Housing
            {
                user_id: userId,
                description: 'Monthly Apartment Rent',
                amount: 1650,
                type: 'expense',
                category: 'Housing',
                date: d(2),
            },
            {
                user_id: userId,
                description: 'Internet — Fiber 1Gbps',
                amount: 65,
                type: 'expense',
                category: 'Utilities',
                date: d(4),
            },
            {
                user_id: userId,
                description: 'Electricity Bill',
                amount: 88,
                type: 'expense',
                category: 'Utilities',
                date: d(5),
            },

            // Food & Drink
            {
                user_id: userId,
                description: 'Whole Foods Weekly Shop',
                amount: 145,
                type: 'expense',
                category: 'Food & Drink',
                date: d(1),
            },
            {
                user_id: userId,
                description: 'Team Lunch — Client Meeting',
                amount: 68,
                type: 'expense',
                category: 'Food & Drink',
                date: d(3),
            },
            {
                user_id: userId,
                description: 'Grocery Run — Fresh Produce',
                amount: 54,
                type: 'expense',
                category: 'Food & Drink',
                date: d(7),
            },
            {
                user_id: userId,
                description: 'Meal Prep Ingredients',
                amount: 92,
                type: 'expense',
                category: 'Food & Drink',
                date: d(10),
            },
            {
                user_id: userId,
                description: 'Coffee — Monthly Subscription (Nespresso)',
                amount: 39,
                type: 'expense',
                category: 'Food & Drink',
                date: d(14),
            },

            // Health
            {
                user_id: userId,
                description: 'Premium Gym Membership',
                amount: 75,
                type: 'expense',
                category: 'Health',
                date: d(5),
            },
            {
                user_id: userId,
                description: 'Protein Powder & Supplements (Monthly)',
                amount: 85,
                type: 'expense',
                category: 'Health',
                date: d(9),
            },
            {
                user_id: userId,
                description: 'Annual Physical Checkup',
                amount: 120,
                type: 'expense',
                category: 'Health',
                date: d(20),
            },

            // Transport
            {
                user_id: userId,
                description: 'Monthly Transit Pass',
                amount: 95,
                type: 'expense',
                category: 'Transport',
                date: d(2),
            },
            {
                user_id: userId,
                description: 'Uber — Office visits (x4)',
                amount: 48,
                type: 'expense',
                category: 'Transport',
                date: d(6),
            },

            // Shopping (Tech/Professional)
            {
                user_id: userId,
                description: 'Mechanical Keyboard — Keychron Q6 Pro',
                amount: 189,
                type: 'expense',
                category: 'Shopping',
                date: d(11),
            },
            {
                user_id: userId,
                description: 'Standing Desk Mat',
                amount: 45,
                type: 'expense',
                category: 'Shopping',
                date: d(18),
            },

            // Entertainment
            {
                user_id: userId,
                description: 'Concert Tickets — Tech Meetup Afterparty',
                amount: 55,
                type: 'expense',
                category: 'Entertainment',
                date: d(13),
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 3: FINANCE — Budget Limits
        // ══════════════════════════════════════════════════
        await supabase.from('budgets').insert([
            { user_id: userId, category: 'Food & Drink', limit_amount: 450, color: '#f59e0b' },
            { user_id: userId, category: 'Transport', limit_amount: 180, color: '#00e5ff' },
            { user_id: userId, category: 'Health', limit_amount: 300, color: '#10b981' },
            { user_id: userId, category: 'Shopping', limit_amount: 250, color: '#f97316' },
            { user_id: userId, category: 'Entertainment', limit_amount: 100, color: '#ec4899' },
            { user_id: userId, category: 'Utilities', limit_amount: 200, color: '#6366f1' },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 3: FINANCE — Savings Goals
        // ══════════════════════════════════════════════════
        await supabase.from('savings_goals').insert([
            {
                user_id: userId,
                name: '6-Month Emergency Fund',
                target_amount: 25000,
                current_amount: 18400,
                icon: '🛡️',
                color: '#10b981',
                target_date: d(-180),
            },
            {
                user_id: userId,
                name: 'Mac Studio + Studio Display',
                target_amount: 5200,
                current_amount: 3800,
                icon: '💻',
                color: '#7c3aed',
                target_date: d(-45),
            },
            {
                user_id: userId,
                name: 'Japan + South Korea Trip',
                target_amount: 8000,
                current_amount: 2350,
                icon: '✈️',
                color: '#00e5ff',
                target_date: d(-210),
            },
            {
                user_id: userId,
                name: 'Real Estate Down Payment',
                target_amount: 50000,
                current_amount: 9600,
                icon: '🏠',
                color: '#f59e0b',
                target_date: d(-730),
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 3: FINANCE — Subscriptions
        // ══════════════════════════════════════════════════
        await supabase.from('subscriptions').insert([
            {
                user_id: userId,
                name: 'GitHub Copilot',
                amount: 19,
                billing_cycle: 'monthly',
                category: 'Other',
                next_billing: nextBill(8),
            },
            {
                user_id: userId,
                name: 'AWS Developer Account',
                amount: 23,
                billing_cycle: 'monthly',
                category: 'Utilities',
                next_billing: nextBill(12),
            },
            {
                user_id: userId,
                name: 'Figma Professional',
                amount: 15,
                billing_cycle: 'monthly',
                category: 'Other',
                next_billing: nextBill(5),
            },
            {
                user_id: userId,
                name: 'Notion Team',
                amount: 16,
                billing_cycle: 'monthly',
                category: 'Other',
                next_billing: nextBill(18),
            },
            {
                user_id: userId,
                name: 'Spotify Premium',
                amount: 11,
                billing_cycle: 'monthly',
                category: 'Entertainment',
                next_billing: nextBill(22),
            },
            {
                user_id: userId,
                name: 'O\'Reilly Learning Platform',
                amount: 499,
                billing_cycle: 'yearly',
                category: 'Other',
                next_billing: nextBill(120),
            },
            {
                user_id: userId,
                name: 'iCloud+ 2TB',
                amount: 9.99,
                billing_cycle: 'monthly',
                category: 'Utilities',
                next_billing: nextBill(3),
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 4: MENTAL GROWTH — Journal Entries
        // ══════════════════════════════════════════════════
        await supabase.from('journal_entries').insert([
            {
                user_id: userId,
                title: 'System design breakthrough — finally clicked',
                content: `Today I had a genuine engineering insight that felt electric. After weeks of wrestling with our distributed caching architecture, the pattern suddenly clicked during a 90-minute deep work session.

The key insight: we were over-engineering the invalidation layer. By moving to event-driven cache busting (rather than TTL-based), we can reduce cache staleness by ~80% while cutting infrastructure complexity by half.

Wrote up a 3-page technical spec. Team review is tomorrow. Feeling deeply satisfied — this is why I do what I do. The connection between focused work and meaningful progress is undeniable.

Key lesson: the solution was simpler than I thought. Complexity is usually a sign of unclear thinking, not a hard problem.`,
                created_at: ts(0, 21, 0),
            },
            {
                user_id: userId,
                title: 'Reflecting on leadership feedback from my 1:1',
                content: `Hard conversation today. My engineering manager flagged that I sometimes present solutions without fully hearing out the team first. It stung initially — I pride myself on collaboration.

But sitting with it tonight, I can see the blind spot. My speed of thinking can sometimes close down space for others to contribute. I've been optimizing for velocity when I should also optimize for inclusion.

Action plan:
1. "Yes, and..." rather than "Actually..." when responding to suggestions in meetings
2. Consciously pause 3 seconds before responding to give ideas room to breathe
3. Ask at least one clarifying question before offering my own take

Growth is uncomfortable. That's the signal it's real. Grateful for honest feedback from someone who wants me to succeed.`,
                created_at: ts(2, 22, 15),
            },
            {
                user_id: userId,
                title: 'Reading "A Philosophy of Software Design" — chapter notes',
                content: `Finished Ousterhout's chapter on "Deep Modules" tonight. Probably the most impactful 30 pages of software theory I've read this year.

Core argument: the best modules are those with simple interfaces that hide deep, complex implementations. The opposite — "shallow modules" with complex APIs and simple implementations — are the enemy of maintainability.

Applied to our codebase, this explains exactly why our UserService became a nightmare. Its interface reflects its implementation complexity. Good API design hides complexity, it doesn't expose it.

Flagged three places in our codebase to refactor based on this framework. Will bring to next architecture review.

The best investment any engineer can make is 30 minutes a day reading outside their immediate work context.`,
                created_at: ts(4, 21, 30),
            },
            {
                user_id: userId,
                title: 'Weekly review — on track, adjustments needed',
                content: `Week 3 self-assessment:

Wins:
- Shipped the auth refactor 2 days ahead of schedule
- Successfully unblocked 2 junior engineers on complex debugging tasks  
- Maintained deep work schedule 5/5 weekday mornings

Misses:
- Didn't finish the API documentation I planned (deprioritised for a fire)
- Skipped one workout (Tuesday — had early stand-up, broke the routine)
- Spent too much time in Slack instead of async first

Theme for next week: defend the calendar. Time is finite. Every yes is a no to something else. This week I'll time-block focused work as non-negotiable meetings.

Score: 7.5/10. Improvement from last week's 6.8.`,
                created_at: ts(7, 20, 0),
            },
            {
                user_id: userId,
                title: 'On the compound effect — 1% better every day',
                content: `Re-read a section of "Atomic Habits" tonight on the mathematics of marginal gains. 

1% better every day = 37x better in a year. 1% worse every day = nearly zero.

This isn't motivation content — it's mathematics applied to human performance. The question I'm sitting with: where am I getting 1% worse without noticing?

Identified two area:
1. Reactive email/Slack habits — I'm letting notifications set my agenda instead of my own priorities
2. Post-dinner screen time is degrading my sleep quality — affecting energy and cognitive clarity the next morning

Making small covenant with myself tonight: Slack off at 7PM. Journal instead.

Small inputs. Long game. Trust the process.`,
                created_at: ts(11, 21, 45),
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 4: MENTAL GROWTH — Mood Logs
        // ══════════════════════════════════════════════════
        await supabase.from('mood_logs').insert([
            { user_id: userId, mood_value: 5, note: 'Flow state for 3 hours. Best work session of the month.', logged_at: ts(0, 20, 30) },
            { user_id: userId, mood_value: 4, note: 'Good energy, solid progress on the tech spec.', logged_at: ts(1, 21, 0) },
            { user_id: userId, mood_value: 3, note: 'Tired after back-to-back meetings. Needed more recovery time.', logged_at: ts(2, 20, 15) },
            { user_id: userId, mood_value: 5, note: 'Crushed both workouts and a full deep work block. Peak day.', logged_at: ts(3, 21, 30) },
            { user_id: userId, mood_value: 4, note: 'Calm and focused. Meditation really helped this morning.', logged_at: ts(4, 20, 0) },
            { user_id: userId, mood_value: 4, note: 'Good creative session — solved a gnarly async bug.', logged_at: ts(5, 21, 0) },
            { user_id: userId, mood_value: 5, note: 'Best Saturday in a while. Gym, reading, no laptop.', logged_at: ts(6, 19, 30) },
            { user_id: userId, mood_value: 3, note: 'Slightly off balance. Didn\'t sleep well. Took it easy.', logged_at: ts(8, 20, 45) },
            { user_id: userId, mood_value: 4, note: 'Productive and connected with the team.', logged_at: ts(9, 21, 0) },
            { user_id: userId, mood_value: 5, note: 'Huge PR shipped. Team morale is high.', logged_at: ts(10, 20, 0) },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 4: MENTAL GROWTH — Gratitude Entries
        // ══════════════════════════════════════════════════
        await supabase.from('gratitude_entries').insert([
            {
                user_id: userId,
                items: [
                    'A team that trusts me and pushes me to grow',
                    'The health and energy to train consistently',
                    'Living in a city with access to world-class resources',
                ],
                created_at: ts(0, 7, 30),
            },
            {
                user_id: userId,
                items: [
                    'The clarity that comes from morning deep work sessions',
                    'A mentor who gives honest, actionable feedback',
                    'Financial stability that lets me invest in growth',
                ],
                created_at: ts(1, 7, 15),
            },
            {
                user_id: userId,
                items: [
                    'Access to incredible learning resources — books, papers, courses',
                    'The compound effect showing up in my codebase quality',
                    'Every hard problem that taught me something lasting',
                ],
                created_at: ts(2, 7, 45),
            },
            {
                user_id: userId,
                items: [
                    'My consistent morning workout habit — now at 18 days strong',
                    'Open source contributors who made my work possible',
                    'A quiet apartment where I can think clearly',
                ],
                created_at: ts(4, 7, 0),
            },
            {
                user_id: userId,
                items: [
                    'The breakthrough insight on distributed caching today',
                    'Friends who challenge and inspire me',
                    'Good coffee that makes mornings worth waking up for',
                ],
                created_at: ts(6, 7, 30),
            },
        ]);

        // Mental Growth Habits
        await supabase.from('habits').insert([
            {
                user_id: userId,
                name: 'Morning meditation — 10 min mindfulness',
                module: 'mental',
                streak: 17,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5), d(6)],
            },
            {
                user_id: userId,
                name: 'Evening journal — daily reflection',
                module: 'mental',
                streak: 22,
                completions: [d(0), d(1), d(2), d(3), d(4), d(5), d(6), d(7)],
            },
            {
                user_id: userId,
                name: 'Daily gratitude practice (3 items)',
                module: 'mental',
                streak: 14,
                completions: [d(0), d(1), d(2), d(3), d(4)],
            },
        ]);

        // ══════════════════════════════════════════════════
        // MODULE 5: CAREER — Profile + Milestones + Jobs
        // ══════════════════════════════════════════════════
        const { data: careerProfile, error: cpErr } = await supabase
            .from('career_profiles')
            .upsert({
                user_id: userId,
                current_position: 'Senior Full-Stack Engineer',
                target_role: 'Staff Engineer / Tech Lead',
                industry: 'Technology / SaaS',
                timeline: '18 months',
                current_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL', 'System Design'],
                target_skills: ['Distributed Systems', 'Technical Leadership', 'Engineering Management', 'Platform Engineering', 'ML/AI Integration'],
                ai_summary: 'Alex is a highly skilled Full-Stack Engineer with 4 years of hands-on experience building scalable SaaS platforms. The transition to Staff Engineer requires deepening expertise in distributed systems, expanding technical influence across multiple teams, and developing formal mentorship and architectural leadership skills. Current trajectory indicates readiness for a Staff role within 12-18 months with consistent focus.',
                ai_quick_win: 'Document and present your distributed caching architecture decision this week — this single artifact demonstrates Staff-level thinking and cross-team impact.',
                skill_gaps: ['Distributed systems architecture at scale', 'Cross-org technical leadership', 'Formal mentorship structure', 'Engineering roadmap planning'],
            })
            .select()
            .single();

        if (!cpErr && careerProfile) {
            await supabase.from('career_milestones').insert([
                {
                    user_id: userId,
                    title: 'Complete Distributed Systems Course (MIT OpenCourseWare)',
                    deadline: d(-30),
                    description: 'Finish MIT 6.824 Distributed Systems. Focus on Raft consensus, Spanner, and MapReduce papers. Take structured notes for team knowledge sharing.',
                    color: '#7c3aed',
                    status: 'done',
                },
                {
                    user_id: userId,
                    title: 'Lead and ship a cross-team technical initiative',
                    deadline: d(-15),
                    description: 'Take ownership of the distributed caching architecture project. Collaborate with the Platform and Data teams. Present the technical design document to senior leadership.',
                    color: '#00e5ff',
                    status: 'active',
                },
                {
                    user_id: userId,
                    title: 'Establish a structured mentorship program (2 junior engineers)',
                    deadline: d(-60),
                    description: 'Formalize bi-weekly 1:1s with mentees. Create a structured curriculum covering code quality, system design, and career development. Track progress with measurable milestones.',
                    color: '#10b981',
                    status: 'upcoming',
                },
                {
                    user_id: userId,
                    title: 'Publish 2 technical blog posts on engineering blog',
                    deadline: d(-90),
                    description: 'Write in-depth technical articles on topics where you have unique expertise (distributed caching, TypeScript performance patterns). Build external technical brand.',
                    color: '#f59e0b',
                    status: 'upcoming',
                },
                {
                    user_id: userId,
                    title: 'Speak at one engineering conference or large internal tech talk',
                    deadline: d(-120),
                    description: 'Submit a proposal to a relevant engineering conference (QCon, SREcon, or JSConf). Alternatively, organize a company-wide architecture review. Demonstrates thought leadership.',
                    color: '#e879f9',
                    status: 'upcoming',
                },
                {
                    user_id: userId,
                    title: 'Internal promotion interview preparation',
                    deadline: d(-150),
                    description: 'Work with manager on formal Staff Engineer promotion case. Document cross-team impact, system design decisions, and mentorship outcomes. Schedule promo committee meeting.',
                    color: '#f97316',
                    status: 'upcoming',
                },
            ]);
        }

        // Job Applications Tracker
        await supabase.from('job_applications').insert([
            {
                user_id: userId,
                company: 'Stripe',
                job_role: 'Staff Engineer, Core API Platform',
                status: 'Interview',
                salary: '$270K–$340K + equity',
                notes: 'Round 2 system design interview scheduled for next Thursday. Prepare distributed rate limiting and API versioning scenarios.',
                color: '#7c3aed',
            },
            {
                user_id: userId,
                company: 'Linear',
                job_role: 'Senior Engineer, Infrastructure',
                status: 'Screening',
                salary: '$220K–$280K + equity',
                notes: 'Currently at recruiter screen. Excited about the team — they ship incredibly fast for a small org.',
                color: '#00e5ff',
            },
            {
                user_id: userId,
                company: 'Vercel',
                job_role: 'Senior Software Engineer, Edge Runtime',
                status: 'Applied',
                salary: '$200K–$250K',
                notes: 'Applied via referral from former colleague. Edge computing is a huge growth area — strong strategic fit.',
                color: '#10b981',
            },
            {
                user_id: userId,
                company: 'Notion',
                job_role: 'Tech Lead, Document Infrastructure',
                status: 'Offer',
                salary: '$290K total comp',
                notes: 'Offer received. Comparing total comp and growth trajectory against Stripe. Decision needed by end of month.',
                color: '#f59e0b',
            },
            {
                user_id: userId,
                company: 'Figma',
                job_role: 'Senior Engineer, Multiplayer Engine',
                status: 'Rejected',
                salary: '$240K–$310K',
                notes: 'Rejected after final round. Feedback: strong technical skills but needed more experience with operational systems at scale. Follow up in 12 months.',
                color: '#ef4444',
            },
        ]);

        // ══════════════════════════════════════════════════
        // TIER 2 & TIER 3 — BEAST MODE MODULES
        // ══════════════════════════════════════════════════

        // 1. Goal Planning
        await supabase.from('goals').insert([
            {
                user_id: userId,
                title: 'Ship V2 Platform to Production',
                description: 'Complete architecture rewrite and successfully migrate 100% of traffic.',
                target_date: d(-45),
                priority: 'high',
                color: '#ef4444',
                progress: 65,
                status: 'active',
                milestones: [
                    { text: 'Finalize database migration script', done: true },
                    { text: 'Complete load testing on staging', done: false },
                    { text: 'Execute dark launch for 10% of users', done: false }
                ],
                ai_analysis: {
                    probability: 82,
                    analysis: 'Strong momentum, but staging timeframe is tightly compressed.',
                    rescue_plan: 'Shift QA resources from mobile app to platform team immediately to de-risk load testing phase.'
                }
            },
            {
                user_id: userId,
                title: 'Transition to Staff Engineer role',
                description: 'Navigate the promotion cycle by demonstrating cross-org leverage.',
                target_date: d(-180),
                priority: 'medium',
                color: '#7c3aed',
                progress: 40,
                status: 'active',
                milestones: [
                    { text: 'Read DDIA and summarize for team', done: true },
                    { text: 'Lead architectural review committee', done: true },
                    { text: 'Mentorship of 2 junior engineers', done: false }
                ]
            }
        ]);

        // 2. Learning
        await supabase.from('learning_items').insert([
            {
                user_id: userId,
                title: 'Designing Data-Intensive Applications',
                category: 'Book',
                target_date: d(-30),
                frequency: 'Weekly',
                color: '#3b82f6',
                progress: 75,
                status: 'In Progress',
                notes: 'Focusing on chapter 5 (Replication) this week.'
            },
            {
                user_id: userId,
                title: 'Advanced React Patterns by Kent C. Dodds',
                category: 'Course',
                url: 'epicreact.dev',
                target_date: d(-15),
                frequency: 'Daily',
                color: '#0ea5e9',
                progress: 100,
                status: 'Completed'
            }
        ]);

        // 3. Life Admin
        await supabase.from('life_admin').insert([
            {
                user_id: userId,
                title: 'Renew Passport',
                category: 'Logistics',
                priority: 'Critical',
                due_date: d(-5),
                color: '#ef4444',
                completed: false,
                ai_consequence: 'If you fail to renew this week, you will not be able to board your international flight to the Tokyo engineering summit next month. Expedited processing fees will jump by $200.'
            },
            {
                user_id: userId,
                title: 'File Q1 Quarterly Taxes',
                category: 'Finance',
                priority: 'High',
                due_date: d(-12),
                color: '#f59e0b',
                completed: false,
                ai_consequence: 'Failure to file on time will result in immediate IRS late penalties of 5% per month on the unpaid tax, plus interest compounding daily.'
            }
        ]);

        // 4. Social Contacts
        await supabase.from('social_contacts').insert([
            {
                user_id: userId,
                name: 'Sarah Chen',
                relationship: 'Mentor',
                company: 'Google',
                industry: 'Tech',
                priority: 'High',
                color: '#10b981',
                initials_color: 'linear-gradient(135deg, #10b981, #059669)',
                follow_up_days: 30,
                last_contacted: d(14),
                birthday: '1985-11-22',
                notes: 'Helped me prep for Staff interviews. Loves artisanal coffee.',
                interaction_logs: [
                    { date: d(45), type: 'Coffee', notes: 'Discussed scaling tradeoffs between Mongo and Postgres.' },
                    { date: d(14), type: 'Message', notes: 'Sent link to the new Stripe engineering blog.' }
                ]
            },
            {
                user_id: userId,
                name: 'David Rodriguez',
                relationship: 'Former Manager',
                company: 'Stripe',
                industry: 'FinTech',
                priority: 'Medium',
                color: '#3b82f6',
                initials_color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                follow_up_days: 90,
                last_contacted: d(110),
                notes: 'Good connector for FinTech opportunities.'
            }
        ]);

        // 5. Risk Radar
        await supabase.from('risk_radar').insert([
            {
                user_id: userId,
                title: 'AWS Production Database Size Spiking',
                category: 'Technical',
                impact: 'Critical',
                likelihood: 'Highly Likely',
                mitigation_plan: 'Implement data archiving strategy for logs older than 30 days. Add read-replicas by Friday.',
                deadline: d(-2),
                color: '#ef4444',
                status: 'Active'
            },
            {
                user_id: userId,
                title: 'Burnout from Q2 Roadmap',
                category: 'Health',
                impact: 'High',
                likelihood: 'Possible',
                mitigation_plan: 'Enforce hard stop at 6 PM. Take trailing Friday off at end of month.',
                deadline: d(-15),
                color: '#f59e0b',
                status: 'Active'
            }
        ]);

        // 6. Time Allocations (Heatmap Data)
        const timeAllocations = [];
        const categories = ['Deep Work', 'Meetings', 'Admin/Email', 'Learning', 'Fitness'];
        for (let i = 0; i < 45; i++) {
            timeAllocations.push({
                user_id: userId,
                title: `Activity Block ${i}`,
                duration_hours: Number((Math.random() * 3 + 1).toFixed(1)),
                category: categories[Math.floor(Math.random() * categories.length)],
                date: d(Math.floor(Math.random() * 30)),
                percentage: Math.floor(Math.random() * 5) + 5 // Simulating "Energy Level" 5-10
            });
        }
        await supabase.from('time_allocations').insert(timeAllocations);

        // 7. Strategy Engine (Decisions)
        await supabase.from('decisions').insert([
            {
                user_id: userId,
                title: 'Adopt GraphQL vs stick with REST for V2',
                context: 'Platform scaling to 100k DAU. Frontend team wants GQL for flexibility, backend team wants REST for caching simplicity.',
                color: '#e879f9',
                status: 'pending',
                ai_analysis: {
                    swot: {
                        strengths: ['GQL solves over-fetching', 'Strong typing system'],
                        weaknesses: ['Complex caching', 'N+1 query risks'],
                        opportunities: ['Faster frontend iteration', 'Consolidated API gateway'],
                        threats: ['Learning curve for backend team', 'Security complexity']
                    },
                    options: [
                        { label: 'GraphQL (Apollo)', pros: 'Exceptional DX, strict schema', cons: 'High infra overhead', score: 8, aiScore: 7, reasoning: 'Offers the best developer velocity if infra team can support it.' },
                        { label: 'REST (OpenAPI)', pros: 'Proven caching, easy CDN integration', cons: 'Waterfall requests, multiple endpoints', score: 6, aiScore: 8, reasoning: 'Safer bet for current backend skill set.' }
                    ],
                    recommendedOption: 'REST (OpenAPI)',
                    devils_advocate: '- REST will eventually crumble under the weight of UI-specific requirements.\n- Your frontend velocity will grind to a halt waiting for custom endpoints.\n- You are choosing short-term backend comfort over long-term product agility.'
                }
            }
        ]);

        // 8. Life Simulator (Simulations)
        await supabase.from('simulations').insert([
            {
                user_id: userId,
                title: 'Career: Stay Technical vs Eng Manager',
                context: 'At a crossroads. I love coding but my highest leverage might be managing people.',
                timeframe_years: 5,
                color: '#0ea5e9',
                ai_prediction: {
                    scenarios: [
                        {
                            name: 'Staff Engineer (Individual Contributor)',
                            summaryPrediction: 'You retain high technical autonomy and deep focus, becoming a critical architectural node.',
                            feasibilityScore: 92,
                            feasibilityNote: 'Aligns strongly with current trajectory.',
                            riskFactors: ['Isolation', 'Value tied purely to technical output limit'],
                            upsidePotential: ['Geographical freedom', 'Elegance in craftsmanship'],
                            metrics: [
                                { year: 0, wealth: 60, health: 70, happiness: 75 },
                                { year: 2, wealth: 75, health: 65, happiness: 85 },
                                { year: 5, wealth: 95, health: 70, happiness: 90 }
                            ]
                        },
                        {
                            name: 'Engineering Manager',
                            summaryPrediction: 'A complete contextual shift. You stop writing code and start building the machine that builds the code.',
                            feasibilityScore: 80,
                            feasibilityNote: 'Will require significant soft-skill development.',
                            riskFactors: ['Calendar fragmentation', 'Loss of hard technical skills'],
                            upsidePotential: ['Organizational leverage', 'Director-level runway'],
                            metrics: [
                                { year: 0, wealth: 60, health: 70, happiness: 60 },
                                { year: 2, wealth: 70, health: 50, happiness: 65 },
                                { year: 5, wealth: 90, health: 60, happiness: 80 }
                            ]
                        }
                    ]
                }
            }
        ]);

        // ══════════════════════════════════════════════════
        // NOTIFICATIONS
        // ══════════════════════════════════════════════════
        await supabase.from('notifications').insert([
            {
                user_id: userId,
                title: '🎯 Milestone Complete!',
                message: 'You completed the MIT Distributed Systems course. This is a major step toward your Staff Engineer goal.',
                type: 'success',
                is_read: false,
            },
            {
                user_id: userId,
                title: '🔥 21-Day Streak!',
                message: 'Your "Deep Work Session" habit has hit 21 consecutive days. You have built a formidable professional skill.',
                type: 'success',
                is_read: false,
            },
            {
                user_id: userId,
                title: '💡 AI Career Insight',
                message: 'Based on your progress, you are on track for a Staff Engineer role 2 months ahead of your original 18-month plan. Prioritise the cross-team project milestone next.',
                type: 'ai',
                is_read: false,
            },
            {
                user_id: userId,
                title: '💰 Savings Milestone',
                message: 'Your Emergency Fund is now at 73% of target ($18,400 / $25,000). At current savings rate you will fully fund it in 6 weeks.',
                type: 'success',
                is_read: true,
            },
            {
                user_id: userId,
                title: '⚠️ Budget Alert',
                message: 'Your Shopping budget is at 94% for the month ($234 / $250). Consider holding off on non-essential purchases for the rest of the month.',
                type: 'warning',
                is_read: true,
            },
        ]);

        console.log('[PriMaX] Professional mock data injected successfully for user:', userId);
        return { success: true };
    } catch (err) {
        console.error('[PriMaX] Mock data injection error:', err);
        return { error: err.message };
    }
};

/**
 * Clears all mock/demo data for a user, restoring real data only.
 * Deletes all rows for the user across all tables seeded by injectMockData.
 */
export const clearMockData = async (userId) => {
    if (!userId) return { error: 'No user ID provided' };
    try {
        const tables = [
            'tasks', 'habits', 'journal_entries', 'mood_logs',
            'workouts', 'transactions', 'savings_goals', 'subscriptions',
            'gratitude_entries', 'affirmations', 'notifications',
            'focus_sessions', 'budgets', 'career_profiles', 'career_milestones',
            'job_applications', 'resumes', 'ai_history',
            'goals', 'learning_items', 'life_admin', 'social_contacts',
            'risk_radar', 'time_allocations', 'decisions', 'simulations'
        ];
        await Promise.all(tables.map(table =>
            supabase.from(table).delete().eq('user_id', userId)
        ));
        console.log('[PriMaX] Mock data cleared for user:', userId);
        return { success: true };
    } catch (err) {
        console.error('[PriMaX] Clear mock data error:', err);
        return { error: err.message };
    }
};
