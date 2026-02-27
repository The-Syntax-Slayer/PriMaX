import { supabase } from './supabase';

export const injectMockData = async (userId) => {
    if (!userId) return { error: 'No user ID provided' };

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const d = (daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };
    const ts = (daysAgo, hour = 10) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
    };

    try {
        // 1. Tasks (Kanban)
        await supabase.from('tasks').insert([
            { user_id: userId, title: 'Finalize Q2 Growth Strategy', status: 'inprogress', priority: 'high', due_date: d(1) },
            { user_id: userId, title: 'Schedule performance review', status: 'todo', priority: 'medium', due_date: d(3) },
            { user_id: userId, title: 'Morning 5km run', status: 'done', priority: 'medium', due_date: today },
            { user_id: userId, title: 'Complete budget audit for March', status: 'todo', priority: 'high', due_date: d(0) },
            { user_id: userId, title: 'Read "Deep Work" - Chapter 5', status: 'inprogress', priority: 'low', due_date: d(2) },
            { user_id: userId, title: 'Update LinkedIn profile', status: 'done', priority: 'low', due_date: d(5) },
            { user_id: userId, title: 'Prepare investor pitch deck', status: 'inprogress', priority: 'high', due_date: d(1) },
            { user_id: userId, title: 'Call with mentor – career path', status: 'done', priority: 'medium', due_date: d(3) },
            { user_id: userId, title: 'Launch side project MVP', status: 'todo', priority: 'high', due_date: d(7) },
            { user_id: userId, title: 'Journal – weekly reflection', status: 'done', priority: 'low', due_date: today },
        ]);

        // 2. Habits (Productivity + Fitness + Mental)
        await supabase.from('habits').insert([
            { user_id: userId, name: 'Deep Work (2hr block)', module: 'productivity', streak: 14, completions: [today, d(1), d(2), d(3), d(4)] },
            { user_id: userId, name: 'Morning Meditation', module: 'mental', streak: 7, completions: [today, d(1), d(2)] },
            { user_id: userId, name: '10,000 Steps', module: 'fitness', streak: 5, completions: [today, d(1)] },
            { user_id: userId, name: 'Read for 30 mins', module: 'productivity', streak: 20, completions: [today, d(1), d(2), d(3)] },
            { user_id: userId, name: 'Gratitude Log', module: 'mental', streak: 12, completions: [today, d(1), d(2), d(3), d(4), d(5)] },
            { user_id: userId, name: 'Cold Shower', module: 'fitness', streak: 3, completions: [today, d(1)] },
            { user_id: userId, name: 'No Social Media before 10am', module: 'productivity', streak: 8, completions: [today, d(1), d(2)] },
        ]);

        // 3. Finance – Transactions
        await supabase.from('transactions').insert([
            { user_id: userId, description: 'Client Project Alpha', amount: 3500, type: 'income', category: 'Freelance', date: today },
            { user_id: userId, description: 'Monthly Salary', amount: 5200, type: 'income', category: 'Salary', date: d(5) },
            { user_id: userId, description: 'Design Course', amount: 149, type: 'income', category: 'Education Revenue', date: d(8) },
            { user_id: userId, description: 'Apartment Rent', amount: 1200, type: 'expense', category: 'Housing', date: d(2) },
            { user_id: userId, description: 'Gym Membership', amount: 55, type: 'expense', category: 'Health', date: d(4) },
            { user_id: userId, description: 'Supermarket', amount: 120, type: 'expense', category: 'Food', date: d(1) },
            { user_id: userId, description: 'AWS Cloud Services', amount: 38, type: 'expense', category: 'Tech', date: today },
            { user_id: userId, description: 'Coffee Subscription', amount: 19, type: 'expense', category: 'Food', date: d(6) },
            { user_id: userId, description: 'Udemy Courses', amount: 60, type: 'expense', category: 'Education', date: d(9) },
            { user_id: userId, description: 'Client Beta Bonus', amount: 800, type: 'income', category: 'Freelance', date: d(3) },
        ]);

        // 4. Finance – Savings Goals
        await supabase.from('savings_goals').insert([
            { user_id: userId, name: 'Emergency Fund', target: 10000, current: 6800, icon: '🛡️', deadline: d(-90) },
            { user_id: userId, name: 'MacBook Pro M3', target: 3200, current: 2100, icon: '💻', deadline: d(-30) },
            { user_id: userId, name: 'Europe Trip 2025', target: 5000, current: 1750, icon: '✈️', deadline: d(-120) },
        ]).select();

        // 5. Fitness – Workouts
        await supabase.from('workouts').insert([
            { user_id: userId, name: 'Upper Body Power', type: 'Strength', duration_minutes: 60, completed_at: ts(0, 7) },
            { user_id: userId, name: 'Evening Cardio', type: 'Cardio', duration_minutes: 35, completed_at: ts(1, 18) },
            { user_id: userId, name: 'Lower Body & Core', type: 'Strength', duration_minutes: 50, completed_at: ts(2, 7) },
            { user_id: userId, name: 'HIIT Sprint Session', type: 'HIIT', duration_minutes: 25, completed_at: ts(3, 6) },
            { user_id: userId, name: 'Yoga & Flexibility', type: 'Flexibility', duration_minutes: 40, completed_at: ts(5, 8) },
            { user_id: userId, name: 'Long Cycle Ride', type: 'Cardio', duration_minutes: 75, completed_at: ts(6, 9) },
            { user_id: userId, name: 'Full Body Compound', type: 'Strength', duration_minutes: 65, completed_at: ts(7, 7) },
        ]);

        // 6. Mental – Journal Entries
        await supabase.from('journal_entries').insert([
            { user_id: userId, title: 'Breakthrough on the project', content: 'Finally solved the architecture problem that has been blocking me for 3 days. The key was simplifying the data layer. Feeling energized and confident.', mood: 'great', date: today },
            { user_id: userId, title: 'Morning reflections', content: 'Grateful for waking up healthy. The morning meditation really set the tone for a focused day. Productivity felt effortless.', mood: 'good', date: d(1) },
            { user_id: userId, title: 'Tough meeting, but growth', content: 'Received hard feedback today. Initially stung, but after reflection I see the value. Every critique is a gift in disguise.', mood: 'neutral', date: d(3) },
            { user_id: userId, title: 'Rest day thoughts', content: 'Sometimes the most productive thing is to rest. Read for 2 hours, cooked a good meal, watched a documentary. Recharged.', mood: 'good', date: d(5) },
            { user_id: userId, title: 'Weekly goals set', content: 'Mapped out this week\'s priorities. The key insight: doing 3 things exceptionally beats doing 10 things poorly. Focus is a superpower.', mood: 'great', date: d(7) },
        ]);

        // 7. Mental – Mood Logs
        await supabase.from('mood_logs').insert([
            { user_id: userId, mood: 5, note: 'Incredible focus day!', logged_at: ts(0, 20) },
            { user_id: userId, mood: 4, note: 'Productive and calm', logged_at: ts(1, 21) },
            { user_id: userId, mood: 3, note: 'Slightly off – tired', logged_at: ts(2, 20) },
            { user_id: userId, mood: 5, note: 'Best week in a while', logged_at: ts(3, 22) },
            { user_id: userId, mood: 4, note: 'Good energy', logged_at: ts(5, 19) },
            { user_id: userId, mood: 4, note: 'Lifted PRs at gym!', logged_at: ts(6, 21) },
            { user_id: userId, mood: 5, note: 'Flow state for 4 hours', logged_at: ts(7, 20) },
        ]);

        // 8. Focus Sessions
        await supabase.from('focus_sessions').insert([
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(0, 9) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(0, 10) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(1, 9) },
            { user_id: userId, duration_minutes: 50, mode: 'focus', completed_at: ts(2, 8) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(3, 11) },
            { user_id: userId, duration_minutes: 25, mode: 'focus', completed_at: ts(4, 10) },
        ]);

        // 9. Career Profile
        await supabase.from('career_profiles').upsert({
            user_id: userId,
            full_name: 'Alex Growth',
            target_role: 'Senior Full-Stack Engineer',
            current_role: 'Full-Stack Developer',
            skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'System Design', 'AI/ML Integration'],
            experience_years: 4,
            summary: 'Passionate engineer building next-gen products with AI and modern web technologies. Focused on scalable architecture and exceptional user experiences.',
        });

        // 10. Notifications
        await supabase.from('notifications').insert([
            { user_id: userId, title: '🎯 Goal Crushed!', message: 'You have completed 5 focus sessions this week — new personal record!', type: 'success', is_read: false },
            { user_id: userId, title: '💡 AI Insight', message: 'Your productivity peaks between 8-11am. Schedule your hardest tasks in this window.', type: 'ai', is_read: false },
            { user_id: userId, title: '💰 Budget Alert', message: 'Your Food category is at 85% of its monthly limit. Consider adjusting for the remaining days.', type: 'warning', is_read: true },
            { user_id: userId, title: '🔥 Streak Milestone!', message: 'Your "Read for 30 mins" habit streak just hit 20 days. Incredible consistency!', type: 'success', is_read: false },
        ]);

        return { success: true };
    } catch (err) {
        console.error('Mock data error:', err);
        return { error: err.message };
    }
};
