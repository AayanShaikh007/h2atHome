import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Login } from './Login';
import { SafetyHub } from './SafetyHub';

interface ProtectedSafetyProps {
    apiUrl: string;
    useMockData?: boolean;
}

export const ProtectedSafety: React.FC<ProtectedSafetyProps> = (props) => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    if (!session) {
        return <Login />;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                    Sign Out
                </button>
            </div>
            <SafetyHub {...props} />
        </div>
    );
};
