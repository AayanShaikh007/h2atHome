import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Login } from './Login';
import { TelemetryDashboard } from './TelemetryDashboard';

interface ProtectedDashboardProps {
    apiUrl: string;
    useMockData?: boolean;
}

export const ProtectedDashboard: React.FC<ProtectedDashboardProps> = (props) => {
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
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return <Login />;
    }

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                    Sign Out
                </button>
            </div>
            <TelemetryDashboard {...props} />
        </div>
    );
};
