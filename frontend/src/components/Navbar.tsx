import React, { useState, useEffect } from 'react';
import { 
  Train, LayoutDashboard, Route, Cpu, Activity, BarChart3, 
  Info, AlertTriangle, Clock, RefreshCw, Radio 
} from 'lucide-react';
import { TrainSummary } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  trains: TrainSummary[];
  selectedTrainId: string;
  setSelectedTrainId: (id: string) => void;
  simulatedTime: string;
  isRunning: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  trains,
  selectedTrainId,
  setSelectedTrainId,
  simulatedTime,
  isRunning,
  onRefresh
}) => {
  // Live Real System Time in Asia/Kolkata timezone (ticks every second)
  const [systemTime, setSystemTime] = useState<string>('');

  useEffect(() => {
    const updateRealClock = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setSystemTime(formatter.format(now));
      } catch (e) {
        setSystemTime(new Date().toLocaleTimeString());
      }
    };

    updateRealClock();
    const interval = setInterval(updateRealClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trains', label: 'Live Trains', icon: Train },
    { id: 'details', label: 'Train Details', icon: Route },
    { id: 'forecast', label: 'ETA Forecast', icon: Cpu },
    { id: 'simulation', label: 'Simulation Room', icon: Activity },
    { id: 'analytics', label: 'ML Analytics', icon: BarChart3 },
    { id: 'system', label: 'System Info', icon: Info },
  ];

  return (
    <header className="bg-[#0b1329] border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
      {/* Top Banner: SIH Notice & Dual Time Clocks */}
      <div className="bg-amber-950/40 border-b border-amber-800/30 px-4 py-1.5 flex flex-col md:flex-row items-center justify-between text-xs gap-1.5">
        <div className="flex items-center space-x-2 text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
          <span className="font-semibold tracking-wide uppercase text-[11px]">Demo / Simulated Mode</span>
          <span className="text-amber-400/70 hidden lg:inline">|</span>
          <span className="text-amber-200/80 hidden lg:inline">
            SIH26028 Research Prototype — Operating with realistic synthetic Indian Railways corridor models.
          </span>
        </div>

        {/* Dual Clocks Indicator: Real System Time vs Simulation Dispatch Time */}
        <div className="flex items-center space-x-2.5">
          {/* 1. Real System Clock */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-700/80 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">System Time · IST:</span>
            <span className="font-mono font-bold text-xs text-white">{systemTime || '--:--:--'}</span>
          </div>

          {/* 2. Controlled Simulation Dispatch Clock */}
          <div className="flex items-center space-x-1.5 bg-blue-950/70 px-2.5 py-0.5 rounded border border-blue-700/60 shadow-inner">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">Simulation Time · IST:</span>
            <span className="font-mono font-bold text-xs text-cyan-200">{simulatedTime || '--:--:--'}</span>
          </div>

          {/* Engine Mode Badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
            isRunning ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
            {isRunning ? 'AUTO TICK' : 'STEP MODE'}
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white">RailETA</span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded">
                  SIH26028
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Ministry of Railways • Dynamic ETA Intelligence</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Train Selector Dropdown & Refresh */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 hidden lg:inline">Active Train:</span>
              <select
                value={selectedTrainId}
                onChange={(e) => setSelectedTrainId(e.target.value)}
                className="bg-slate-900/90 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {trains.map((t) => (
                  <option key={t.train_id} value={t.train_id}>
                    #{t.train_number} - {t.train_name} (+{t.current_delay_minutes.toFixed(0)}m)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onRefresh}
              title="Refresh telemetry"
              className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav scrollable bar */}
      <div className="md:hidden flex overflow-x-auto px-2 py-1.5 bg-slate-900/60 border-t border-slate-800 space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] whitespace-nowrap ${
                isActive ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
