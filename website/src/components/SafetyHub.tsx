import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { AlertTriangle, Fan, Gauge, Power, Activity, AlertOctagon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlassCard } from './ui/GlassCard';
import { motion } from 'framer-motion';

interface SafetyHubProps {
    apiUrl: string;
    useMockData?: boolean;
}

export const SafetyHub: React.FC<SafetyHubProps> = ({ apiUrl, useMockData = false }) => {
    const { data, loading, error } = useTelemetry(apiUrl, 1500, useMockData);
    const [isSystemActive, setIsSystemActive] = useState(true);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = (clientX - (left + width / 2)) * 0.2;
        const y = (clientY - (top + height / 2)) * 0.2;
        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    // Sync system active state with data if available
    useEffect(() => {
        if (data) {
            // Logic to sync state
        }
    }, [data]);

    const handleEmergencyStop = () => {
        setIsSystemActive(false);
        toast.error(
            <div className="flex flex-col font-medium text-sm">
                <span className="font-bold text-lg text-white">HARD SHUTDOWN</span>
                <span className="text-white/80">Emergency system stop initiate.</span>
            </div>,
            {
                position: "bottom-right",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "dark",
                icon: <AlertOctagon className="h-6 w-6 text-red-500" />,
                className: 'backdrop-blur-xl bg-slate-900/90 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.4)] rounded-xl !text-white',
                progressClassName: '!bg-red-500',
            }
        );
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                <p className="ml-4 text-white/70 font-mono tracking-wider">SAFETY_SYS_INIT...</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <GlassCard className="p-8 border-red-500/30 bg-red-900/10">
                <h3 className="text-xl font-semibold text-red-400">Safety System Error</h3>
                <p className="mt-2 text-red-200">{error}</p>
            </GlassCard>
        );
    }

    if (!data) return null;

    // Safety Thresholds
    const isGasLeak = data.gas_ppm > 1000;
    const isGasWarning = data.gas_ppm > 400;
    const isPressureHigh = data.pressure_bar > 650;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <ToastContainer />

            {/* 2x2 Grid Layout */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >

                {/* Gas Leak Detection */}
                <GlassCard
                    className={`${isGasLeak ? '!bg-red-500/10 !border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]' :
                        isGasWarning ? '!bg-yellow-500/10 !border-yellow-500/40' : ''}`}
                    metadata="GAS_SENS_01"
                    metadataPosition="bottom-left"
                >
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isGasWarning ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                                <AlertTriangle className={`h-5 w-5 ${isGasWarning ? 'text-yellow-400' : 'text-green-400'}`} />
                            </div>
                            Air Quality / Gas
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border font-mono tracking-wider ${isGasLeak ? 'bg-red-500/20 text-red-200 border-red-500/30 animate-pulse' :
                            isGasWarning ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' :
                                'bg-green-500/20 text-green-300 border-green-500/30'
                            }`}>
                            {isGasLeak ? 'CRITICAL_LEAK' : isGasWarning ? 'WARNING_DETECTED' : 'ATMOSPHERE_NORMAL'}
                        </span>
                    </div>
                    <div className="flex items-end gap-3 relative z-10">
                        <span className={`text-6xl font-bold font-mono ${isGasLeak ? 'text-red-400' :
                            isGasWarning ? 'text-yellow-400' :
                                'text-white'
                            }`}>
                            {data.gas_ppm}
                        </span>
                        <span className="text-white/40 mb-2 font-mono text-sm">PPM</span>
                    </div>
                    <p className="text-xs font-mono text-white/30 mt-4 relative z-10 uppercase tracking-widest">
                        THRESHOLD: &lt; 400 PPM
                    </p>
                </GlassCard>

                {/* Storage Pressure */}
                <GlassCard metadata="PRESS_MAIN" metadataPosition="bottom-left">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Gauge className="h-5 w-5 text-blue-400" />
                            </div>
                            Storage Pressure
                        </h3>
                        <span className="text-xs font-mono text-white/40">MAX: 700 BAR</span>
                    </div>
                    <div className="flex items-end gap-3 mb-6 relative z-10">
                        <span className="text-6xl font-bold text-white font-mono">{data.pressure_bar}</span>
                        <span className="text-white/40 mb-2 font-mono text-sm">BAR</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden relative z-10 backdrop-blur-sm">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 shadow-lg ${isPressureHigh ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/50' : 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-blue-500/50'
                                }`}
                            style={{ width: `${Math.min((data.pressure_bar / 700) * 100, 100)}%` }}
                        ></div>
                    </div>
                </GlassCard>

                {/* Ventilation System */}
                <GlassCard metadata="HVAC_CTRL_04" metadataPosition="top-right">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10">
                                <Fan className={`h-5 w-5 ${data.vent_status === 'Purging' ? 'animate-spin text-blue-400' : 'text-white/40'}`} />
                            </div>
                            Ventilation System
                        </h3>
                    </div>
                    <div className="flex items-center gap-6 relative z-10 mt-6">
                        <div className={`p-4 rounded-full backdrop-blur-md border border-white/5 shadow-inner ${data.vent_status === 'Purging' ? 'bg-blue-500/20 border-blue-500/30' :
                            data.vent_status === 'Malfunction' ? 'bg-red-500/20 border-red-500/30' :
                                'bg-white/5'
                            }`}>
                            <Fan className={`h-10 w-10 ${data.vent_status === 'Purging' ? 'text-blue-400 animate-spin duration-[3000ms]' :
                                data.vent_status === 'Malfunction' ? 'text-red-400' :
                                    'text-white/20'
                                }`} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white font-mono uppercase tracking-tight">{data.vent_status}</p>
                            <p className="text-sm text-white/40 font-mono mt-1">
                                {data.vent_status === 'Purging' ? 'HIGH_RPM // PURGE ACTIVE' : 'RPM 0 // STANDBY_MODE'}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Stack Power */}
                <GlassCard metadata="PWR_BUS_A" metadataPosition="top-right">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Activity className="h-5 w-5 text-purple-400" />
                            </div>
                            Stack Power
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-xs text-white/40 font-mono uppercase mb-1">Bus Voltage</p>
                            <p className="text-3xl font-bold text-white font-mono">
                                {isSystemActive ? data.voltage_v : 0} <span className="text-sm font-normal text-white/30">V</span>
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-xs text-white/40 font-mono uppercase mb-1">Load Current</p>
                            <p className="text-3xl font-bold text-white font-mono">
                                {isSystemActive ? data.current_a : 0} <span className="text-sm font-normal text-white/30">A</span>
                            </p>
                        </div>
                    </div>
                </GlassCard>

            </motion.div>

            {/* Emergency Controls - Magnetic Button */}
            <div className="mt-12 flex justify-center">
                <motion.button
                    ref={btnRef}
                    onClick={handleEmergencyStop}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    animate={{ x: position.x, y: position.y }}
                    transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
                    disabled={!isSystemActive}
                    className={`relative w-full md:w-2/3 py-8 rounded-[2rem] font-bold text-2xl font-mono tracking-widest shadow-[0_0_40px_rgba(239,68,68,0.2)] flex items-center justify-center gap-4 backdrop-blur-xl border overflow-hidden group ${isSystemActive
                        ? 'bg-red-600/80 hover:bg-red-600 text-white border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                        }`}
                >
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

                    <Power className={`h-10 w-10 relative z-10 ${isSystemActive ? 'group-hover:scale-110 transition-transform' : ''}`} />
                    <span className="relative z-10">
                        {isSystemActive ? 'FORCE STOP // EMERGENCY SHUTDOWN' : 'SYSTEM_HALTED'}
                    </span>
                </motion.button>
            </div>

            <p className="text-center mt-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
                Ref: CAN/BNQ 1784-000 // Auth: SYS_ADMIN
            </p>
        </div>
    );
};
