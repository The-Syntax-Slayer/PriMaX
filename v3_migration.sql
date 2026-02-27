-- =============================================
-- PriMaX Hub — V3 Schema Extension (New Features)
-- =============================================

-- RESUMES (Career Module)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Resume',
    content_json JSONB NOT NULL DEFAULT '{}',
    template_id TEXT DEFAULT 'modern',
    last_edited TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- FOCUS SESSIONS (Productivity Module)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    duration_minutes INT NOT NULL,
    mode TEXT NOT NULL, -- 'focus', 'short_break', 'long_break'
    completed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own focus sessions" ON public.focus_sessions
    FOR ALL USING (auth.uid() = user_id);

-- AI HISTORY (Global Persistence)
CREATE TABLE IF NOT EXISTS public.ai_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module TEXT NOT NULL, -- 'career', 'finance', 'fitness', 'mental', 'productivity', 'global'
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AI history" ON public.ai_history
    FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS (Global System)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'achievement'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'productivity_streak', 'career_builder', 'savings_pro'
    level INT DEFAULT 1,
    progress DECIMAL DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = user_id);
