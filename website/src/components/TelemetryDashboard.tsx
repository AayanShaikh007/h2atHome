import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlassCard } from './ui/GlassCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Thermometer, Zap, Droplets, Battery, Gauge, Server, AlertTriangle } from 'lucide-react';

interface TelemetryDashboardProps {
  apiUrl: string;
  useMockData?: boolean;
}

const formatTimestamp = (ms: number): string => {
  return new Date(ms).toLocaleString();
};

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ apiUrl, useMockData = false }) => {
  const [isUsingMockData, setIsUsingMockData] = useState(useMockData);
  const { data, loading, error, refetch } = useTelemetry(apiUrl, 1500, isUsingMockData);

  const prevHydrogenRateRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    const savedRate = sessionStorage.getItem('lastHydrogenRate');
    if (savedRate) {
      prevHydrogenRateRef.current = parseFloat(savedRate);
    }
    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (data && isInitializedRef.current) {
      const currentRate = data.hydrogen_rate;
      const prevRate = prevHydrogenRateRef.current;

      const toastConfig = {
        position: "bottom-right" as const,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark" as const,
        className: 'backdrop-blur-xl bg-slate-900/80 border border-white/20 shadow-2xl rounded-xl !text-white',
        progressClassName: '!bg-blue-500',
      };

      if (prevRate === 0 && currentRate > 0) {
        toast.success(
          <div className="flex flex-col font-medium text-sm">
            <span className="font-bold text-lg text-white">🚀 Production Active</span>
            <span className="text-white/80">Hydrogen generation has started.</span>
          </div>,
          toastConfig
        );
      } else if (prevRate > 0 && currentRate === 0) {
        toast.info(
          <div className="flex flex-col font-medium text-sm">
            <span className="font-bold text-lg text-white">🛑 Production Stopped</span>
            <span className="text-white/80">Hydrogen generation ended.</span>
          </div>,
          toastConfig
        );
      }

      prevHydrogenRateRef.current = currentRate;
      sessionStorage.setItem('lastHydrogenRate', currentRate.toString());
    }
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[500px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/20"></div>
        </div>
        <p className="ml-4 text-white/70 font-mono tracking-widest text-sm">INITIALIZING_TELEMETRY...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <GlassCard className="p-8 text-center border-red-500/30 bg-red-900/10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-red-200">SIGNAL_LOST</h3>
        <p className="mt-2 text-white/50">{error}</p>
        <button
          onClick={refetch}
          className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-white rounded-lg transition backdrop-blur-sm font-mono text-xs uppercase tracking-wider"
        >
          Reconnect
        </button>
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6">
      <ToastContainer
        toastClassName={(context) =>
          context?.defaultClassName + " !bg-slate-900/80 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl !text-white"
        }
      />

      {/* Control Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-sm font-mono text-white/40 tracking-widest uppercase">SYS_STATUS: ONLINE</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${data.system_ok ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400 shadow-[0_0_10px_#f87171]'} animate-pulse`}></div>
            <span className="text-white/80 font-medium">{data.system_ok ? 'All Systems Nominal' : 'System Check Required'}</span>
          </div>
        </div>

        <GlassCard className="!rounded-full px-5 py-2 border-white/10 bg-white/5 hover:bg-white/10 transition-colors" noPadding>
          <div className="flex items-center gap-4">
            <span className={`text-[10px] font-mono font-bold tracking-widest translate-y-[1px] ${isUsingMockData ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`}>
              {isUsingMockData ? 'SIMULATION_MODE' : 'LIVE_FEED'}
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isUsingMockData}
                onChange={(e) => setIsUsingMockData(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-950 rounded-full peer border border-white/10 peer-checked:border-yellow-500/50 peer-checked:bg-yellow-500/10 relative transition-all shadow-inner">
                <div className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-full transition-all duration-300 shadow-lg ${isUsingMockData ? 'translate-x-4 bg-yellow-400 shadow-yellow-500/50' : 'bg-slate-400 shadow-black/50'}`}></div>
              </div>
            </label>
          </div>
        </GlassCard>
      </div>

      {/* Bento Grid Layout */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-min"
      >

        {/* Main KPI: Hydrogen Rate (2x2) */}
        <GlassCard className="col-span-1 md:col-span-2 row-span-2 relative group md:aspect-square flex flex-col justify-between" metadata="H2_GEN_RATE">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-medium text-white/60">Hydrogen Production</h3>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-grow py-8">
            <div className="text-7xl xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 font-mono tracking-tighter drop-shadow-2xl">
              {data.hydrogen_rate.toFixed(3)}
            </div>
            <div className="mt-4 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-sm">
              LITERS / MINUTE
            </div>
          </div>

          {/* Decorative Graph Line (CSS only for now) */}
          <div className="w-full h-16 opacity-30 flex items-end gap-1 overflow-hidden mask-image-gradient">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-1 bg-blue-400 rounded-t-sm transition-all duration-500" style={{ height: `${20 + Math.random() * 60}%` }}></div>
            ))}
          </div>
        </GlassCard>

        {/* Temperature (1x1) */}
        <GlassCard className="col-span-1" metadata="THERM_01">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 mb-4 inline-block">
              <Thermometer className="h-5 w-5" />
            </div>
            {data.temperature_c > 60 && <span className="animate-ping h-2 w-2 rounded-full bg-red-500"></span>}
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Core Temp</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">
              {data.temperature_c.toFixed(1)}<span className="text-xl text-white/30 ml-1">°C</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((data.temperature_c / 100) * 100, 100)}%` }}></div>
          </div>
        </GlassCard>

        {/* Pressure (1x1) */}
        <GlassCard className="col-span-1" metadata="PRESS_AUX">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mb-4 inline-block">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Storage Pressure</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">
              {(data.pressure_bar * 14.5038).toFixed(0)}<span className="text-xl text-white/30 ml-1">psi</span>
            </div>
          </div>
          {/* Progress Bar relative to 350 bar (approx 5000 psi) standard */}
          <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((data.pressure_bar / 350) * 100, 100)}%` }}></div>
          </div>
        </GlassCard>

        {/* Power (Double width or 2x1) -> Let's keep consistent 1x1 for grid or make it 2x1 bottom */}
        <GlassCard className="col-span-1" metadata="PWR_MAIN">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 mb-4 inline-block">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Power Draw</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">
              {data.power_w.toFixed(1)}<span className="text-xl text-white/30 ml-1">W</span>
            </div>
          </div>
        </GlassCard>

        {/* Voltage (1x1) */}
        <GlassCard className="col-span-1" metadata="VOLT_IN">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mb-4 inline-block">
              <Battery className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Voltage</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">
              {data.voltage_v.toFixed(2)}<span className="text-xl text-white/30 ml-1">V</span>
            </div>
          </div>
        </GlassCard>

        {/* Current (1x1) */}
        <GlassCard className="col-span-1" metadata="AMP_LOAD">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 mb-4 inline-block">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Current</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">
              {data.current_a.toFixed(3)}<span className="text-xl text-white/30 ml-1">A</span>
            </div>
          </div>
        </GlassCard>

        {/* System Status (1x1) */}
        <GlassCard className={`col-span-1 ${data.system_ok ? 'border-green-500/20' : 'border-red-500/20'}`} metadata="SYS_DIAG">
          <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg ${data.system_ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} mb-4 inline-block`}>
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-white/40 font-medium uppercase">Diagnostic</span>
            <div className={`text-3xl font-bold font-mono mt-1 ${data.system_ok ? 'text-green-400' : 'text-red-400'}`}>
              {data.system_ok ? 'NOMINAL' : 'FAULT'}
            </div>
          </div>
        </GlassCard>

      </motion.div>

      {/* Footer / Last Update */}
      <div className="mt-8 flex justify-end">
        <GlassCard className="!rounded-full py-2 px-4 inline-flex items-center gap-2 border-white/5 bg-white/0" noPadding>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="text-xs font-mono text-white/40">
            LAST_PACKET: {formatTimestamp(data.timestamp_ms)}
          </span>
        </GlassCard>
      </div>
    </div>
  );
};
