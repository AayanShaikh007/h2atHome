import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { AlertTriangle, Fan, Gauge, Power, Activity, AlertOctagon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SafetyHubProps {
    apiUrl: string;
    useMockData?: boolean;
}

export const SafetyHub: React.FC<SafetyHubProps> = ({ apiUrl, useMockData = false }) => {
    const { data, loading, error } = useTelemetry(apiUrl, 1500, useMockData);
    const [isSystemActive, setIsSystemActive] = useState(true);

    // Sync system active state with data if available (mock data sets it to true initially)
    useEffect(() => {
        if (data) {
            // In a real app, we might want to respect the server's state, but for this demo
            // we let the local state override if the user clicked emergency stop.
            // However, since mock data always returns true, we'll just use local state for the UI effect.
        }
    }, [data]);

    const handleEmergencyStop = () => {
        setIsSystemActive(false);
        const isDarkMode = document.documentElement.classList.contains('dark');
        toast.error('SYSTEM HARD SHUTDOWN INITIATED', {
            position: "top-center",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: isDarkMode ? "dark" : "colored",
            icon: <AlertOctagon className="h-6 w-6 text-white" />
        });
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600 dark:text-slate-300">Loading safety systems...</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-6">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Safety System Error</h3>
                <p className="mt-2 text-red-800 dark:text-red-300">{error}</p>
            </div>
        );
    }

    if (!data) return null;

    // Safety Thresholds
    const isGasLeak = data.gas_ppm > 1000;
    const isGasWarning = data.gas_ppm > 400;
    const isPressureHigh = data.pressure_bar > 650;

    return (
        <div className="space-y-6">
            <ToastContainer />

            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Gas Leak Detection */}
                <div className={`rounded-xl border p-6 shadow-sm transition-all ${isGasLeak ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                        isGasWarning ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                            'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className={`h-5 w-5 ${isGasWarning ? 'text-yellow-500' : 'text-green-500'}`} />
                            Gas Leak Detection
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isGasLeak ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                isGasWarning ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                            {isGasLeak ? 'CRITICAL' : isGasWarning ? 'WARNING' : 'NORMAL'}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-bold ${isGasLeak ? 'text-red-600 dark:text-red-400' :
                                isGasWarning ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-gray-900 dark:text-white'
                            }`}>
                            {data.gas_ppm}
                        </span>
                        <span className="text-gray-500 dark:text-slate-400 mb-1">PPM</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                        Threshold: &lt; 400 PPM (Normal) | &gt; 1000 PPM (Critical)
                    </p>
                </div>

                {/* Storage Pressure */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-blue-500" />
                            Storage Pressure
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-slate-400">Max: 700 bar</span>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{data.pressure_bar}</span>
                        <span className="text-gray-500 dark:text-slate-400 mb-1">bar</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-4 rounded-full transition-all duration-500 ${isPressureHigh ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${Math.min((data.pressure_bar / 700) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Ventilation System */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Fan className={`h-5 w-5 ${data.vent_status === 'Purging' ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
                            Ventilation System
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${data.vent_status === 'Purging' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                data.vent_status === 'Malfunction' ? 'bg-red-100 dark:bg-red-900/30' :
                                    'bg-gray-100 dark:bg-slate-700'
                            }`}>
                            <Fan className={`h-8 w-8 ${data.vent_status === 'Purging' ? 'text-blue-600 dark:text-blue-400 animate-spin' :
                                    data.vent_status === 'Malfunction' ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-400 dark:text-slate-400'
                                }`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.vent_status}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {data.vent_status === 'Purging' ? 'Active ventilation in progress' : 'System in standby mode'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stack Power */}
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-500" />
                            Stack Power
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                            <p className="text-sm text-gray-500 dark:text-slate-400">Voltage</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isSystemActive ? data.voltage_v : 0} <span className="text-sm font-normal">V</span>
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                            <p className="text-sm text-gray-500 dark:text-slate-400">Current</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isSystemActive ? data.current_a : 0} <span className="text-sm font-normal">A</span>
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Emergency Controls */}
            <div className="mt-8">
                <button
                    onClick={handleEmergencyStop}
                    disabled={!isSystemActive}
                    className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${isSystemActive
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-75'
                        }`}
                >
                    <Power className="h-8 w-8" />
                    {isSystemActive ? 'FORCE STOP / EMERGENCY SHUTDOWN' : 'SYSTEM SHUTDOWN ACTIVE'}
                </button>
                <p className="text-center mt-4 text-xs text-gray-400 dark:text-slate-500">
                    Compliance Reference: CAN/BNQ 1784-000 / TSSA O. Reg. 214/01
                </p>
            </div>
        </div>
    );
};
