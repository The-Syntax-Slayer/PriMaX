import { supabase } from './supabase';

export const injectMockData = async (userId) => {
    if (!userId) return { error: 'No user ID provided' };

    console.log('Injecting mock data for user:', userId);

    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        // 1. Tasks
        const mockTasks = [
            { user_id: userId, title: 'Finalize quarterly growth strategy', status: 'in-progress', priority: 'high', category: 'Career' },
            { user_id: userId, title: 'Schedule performance review with team', status: 'todo', priority: 'medium', category: 'Career' },
            { user_id: userId, title: 'Morning 5km run', status: 'done', priority: 'medium', category: 'Fitness' },
            { user_id: userId, title: 'Budget review for March', status: 'todo', priority: 'high', category: 'Finance' },
            { user_id: userId, title: 'Read "Building a Second Brain"', status: 'in-progress', priority: 'low', category: 'Productivity' },
        ];
        await supabase.from('tasks').insert(mockTasks);

        // 2. Habits
        const mockHabits = [
            { user_id: userId, name: 'Deep Work (2hr)', module: 'productivity', streak: 12, completions: [today, lastWeek] },
            { user_id: userId, name: 'Meditation', module: 'mental', streak: 5, completions: [today] },
            { user_id: userId, name: '10k Steps', module: 'fitness', streak: 3, completions: [] },
        ];
        await supabase.from('habits').insert(mockHabits);

        // 3. Transactions
        const mockTransactions = [
            { user_id: userId, description: 'Client Project Alpha', amount: 2500, type: 'income', category: 'Work', date: today },
            { user_id: userId, description: 'Co-working Office Rent', amount: 450, type: 'expense', category: 'Business', date: today },
            { user_id: userId, description: 'Supermarket', amount: 85, type: 'expense', category: 'Food', date: lastWeek },
        ];
        await supabase.from('transactions').insert(mockTransactions);

        // 4. Workouts
        const mockWorkouts = [
            { user_id: userId, name: 'Upper Body Power', type: 'Strength', duration_minutes: 55, completed_at: today },
            { user_id: userId, name: 'Evening Cardio', type: 'Cardio', duration_minutes: 30, completed_at: lastWeek },
        ];
        await supabase.from('workouts').insert(mockWorkouts);

        // 5. Notifications
        const mockNotifs = [
            { user_id: userId, title: 'Target Achieved!', message: 'You have surpassed your savings goal for this month. Excellent work!', type: 'success' },
            { user_id: userId, title: 'New AI Insight', message: 'Your productivity is 20% higher in the mornings. Consider shifting deep work earlier.', type: 'ai' },
        ];
        await supabase.from('notifications').insert(mockNotifs);

        return { success: true };
    } catch (err) {
        console.error('Mock data error:', err);
        return { error: err.message };
    }
};
