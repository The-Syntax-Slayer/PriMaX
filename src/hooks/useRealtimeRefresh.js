import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * A custom hook to listen to Supabase realtime changes for a specific table 
 * and trigger a refresh callback.
 */
export function useRealtimeRefresh(table, userId, onRefresh) {
    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`public:${table}:${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table, filter: `user_id=eq.${userId}` },
                () => {
                    if (onRefresh) onRefresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, userId, onRefresh]);
}
