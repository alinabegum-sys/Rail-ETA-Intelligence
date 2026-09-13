import React, { useState } from 'react';
import { 
  Play, Pause, StepForward, RotateCcw, AlertTriangle, 
  Radio, Activity, CheckCircle2, Zap, History, Clock, ArrowRight 
} from 'lucide-react';
import { TrainSummary, OperationalEvent, EventHistoryItem } from '../types';

interface SimulationControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: (minutes: number) => void;
  onReset: () => void;
  trains: TrainSummary[];
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
  onInjectEvent: (event: {
    train_id: string;
    event_type: string;
    severity: string;
    duration_minutes: number;
    location: string;
    description: string;
  }) => void;
  onResolveEvent: (eventId: string) => void;
  activeEvents: OperationalEvent[];
  eventHistory: EventHistoryItem[];
}

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  isRunning,
  onStart,
  onPause,
  onStep,
  onReset,
  trains,
  selectedTrainId,
  onSelectTrain,
  onInjectEvent,
  onResolveEvent,
  activeEvents,
  eventHistory
}) => {
  const [selectedEventType, setSelectedEventType] = useState('Speed Restriction');
  const [severity, setSeverity] = useState('Moderate');
  const [location, setLocation] = useState('Outer Signal Approaching Junction');
  const [duration, setDuration] = useState(25);
  const [stepMinutes, setStepMinutes] = useState(15);

  const eventPresets = [
    { type: 'Speed Restriction', icon: '🚧', defaultLoc: 'Track Turnout Renewal Section', severity: 'Moderate', desc: 'Temporary Caution Order TSR 30 km/h applied' },
    { type: 'Signal Delay', icon: '🚦', defaultLoc: 'Interlocking Automatic Signal Post', severity: 'Major', desc: 'Signal aspect failure / red aspect wait' },
    { type: 'Heavy Congestion', icon: '🚆', defaultLoc: 'High-Density Quadruple Trunk', severity: 'Moderate', desc: 'Freight train block clearance headway throttle' },
    { type: 'Unscheduled Halt', icon: '🛑', defaultLoc: 'Level Crossing Gate / Yard Caution', severity: 'Critical', desc: 'Emergency brake inspection / gate clearance' },
    { type: 'Weather Disruption', icon: '🌧️', defaultLoc: 'Ghat Monsoon Sector', severity: 'Major', desc: 'Torrential downpour with reduced driver sighting' },
    { type: 'Track Maintenance', icon: '🔧', defaultLoc: 'Bridge Replacement Speed Caution', severity: 'Moderate', desc: 'Engineering block caution order 45 km/h' },
    { type: 'Normal Recovery', icon: '⚡', defaultLoc: 'Clear Triple High-Speed Track', severity: 'Minor', desc: 'All caution orders lifted, green signals ahead' }
  ];

  const handleInject = () => {
    const preset = eventPresets.find(p => p.type === selectedEventType);
    onInjectEvent({
      train_id: selectedTrainId,
      event_type: selectedEventType,
      severity,
      duration_minutes: duration,
      location: location || preset?.defaultLoc || 'Main Line Block',
      description: preset?.desc || `${selectedEventType} operational perturbation`
    });
  };

  const selectedTrain = trains.find(t => t.train_id === selectedTrainId);

  return (
    <div className="space-y-6">
      {/* Simulation Master Controller */}
      <div className="p-5 rounded-xl border border-blue-900/40 bg-slate-900/60 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <h3 className="text-base font-bold text-white tracking-wide">SIMULATION COCKPIT</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                TIME-ACCELERATED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Advance time, inject operational disruptions, and watch downstream ETAs recalculate dynamically
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isRunning ? onPause : onStart}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pause Engine' : 'Auto Play'}</span>
            </button>

            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <select
                value={stepMinutes}
                onChange={(e) => setStepMinutes(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-300 px-2 py-1 outline-none"
              >
                <option value={10}>+10 min</option>
                <option value={15}>+15 min</option>
                <option value={30}>+30 min</option>
                <option value={60}>+60 min</option>
              </select>
              <button
                onClick={() => onStep(stepMinutes)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Step Forward</span>
              </button>
            </div>

            <button
              onClick={onReset}
              title="Reset trains to initial demo state"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Train Quick Telemetry Banner */}
        {selectedTrain && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TRAIN NUMBER</span>
              <span className="font-bold text-white text-sm">{selectedTrain.train_number}</span>
              <span className="text-[10px] text-blue-400 block truncate">{selectedTrain.train_name}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CURRENT SPEED</span>
              <span className="font-bold text-blue-400 text-sm font-mono">{selectedTrain.speed.toFixed(0)} km/h</span>
              <span className="text-[10px] text-slate-400 block">Nominal: 110-130 km/h</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CURRENT DELAY</span>
              <span className={`font-bold text-sm font-mono ${
                selectedTrain.current_delay_minutes > 20 ? 'text-rose-400' : selectedTrain.current_delay_minutes > 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                +{selectedTrain.current_delay_minutes.toFixed(0)} mins
              </span>
              <span className="text-[10px] text-slate-400 block">at {selectedTrain.current_station || 'Origin'}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">NEXT STATION</span>
              <span className="font-bold text-white text-sm truncate block">{selectedTrain.next_station}</span>
              <span className="text-[10px] text-slate-400 block">Approaching</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px]">PREDICTED TERMINUS</span>
              <span className="font-bold text-cyan-400 text-sm font-mono">{selectedTrain.predicted_final_eta}</span>
              <span className="text-[10px] text-slate-400 block">Delay: +{selectedTrain.predicted_final_delay.toFixed(0)}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Disruption Injection Panel */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Introduce Real-Time Operational Event
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select an incident category. Injecting an event directly perturbs the train kinematic state and triggers ML dynamic ETA recalculation across all downstream stops.
        </p>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {eventPresets.map((preset) => {
            const isSelected = selectedEventType === preset.type;
            return (
              <button
                key={preset.type}
                onClick={() => {
                  setSelectedEventType(preset.type);
                  setLocation(preset.defaultLoc);
                  setSeverity(preset.severity);
                }}
                className={`p-2 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="text-base mb-1">{preset.icon}</div>
                <div className="font-semibold text-[11px] leading-tight">{preset.type}</div>
              </button>
            );
          })}
        </div>

        {/* Configuration inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Target Train</label>
            <select
              value={selectedTrainId}
              onChange={(e) => onSelectTrain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
            >
              {trains.map(t => (
                <option key={t.train_id} value={t.train_id}>
                  {t.train_number} - {t.train_name} (+{t.current_delay_minutes.toFixed(0)}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Severity Rating</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="Minor">Minor (Delay shock: +4 min)</option>
              <option value="Moderate">Moderate (Delay shock: +8 min)</option>
              <option value="Major">Major (Delay shock: +15 min)</option>
              <option value="Critical">Critical (Delay shock: +22 min)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Incident Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kanpur Outer Yard Signal"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleInject}
          className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Inject Disruption & Recalculate ETA Cascade</span>
        </button>
      </div>

      {/* Active Operational Disruptions List */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Network Disruptions ({activeEvents.length})
            </h3>
          </div>
        </div>

        {activeEvents.length === 0 ? (
          <div className="text-center py-5 text-xs text-slate-500 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All corridors operating smoothly without active disruption blocks.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeEvents.map((ev) => (
              <div
                key={ev.event_id}
                className="p-3 bg-slate-950/80 rounded-lg border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-xs">{ev.event_type}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
                      {ev.severity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Train ID: {ev.train_id}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{ev.location} — {ev.description}</p>
                </div>
                <button
                  onClick={() => onResolveEvent(ev.event_id)}
                  className="self-start sm:self-center px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded text-xs font-semibold transition"
                >
                  Resolve Disruption
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event History Log */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="flex items-center space-x-2 mb-3">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Event Simulation History Log ({eventHistory.length})
          </h3>
        </div>

        {eventHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No simulated events triggered in this session yet. Use the control panel above to introduce caution orders or signal delays.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left text-slate-300">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Train</th>
                  <th className="py-2 px-3">Event Type</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Delay Delta</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {eventHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20">
                    <td className="py-2 px-3 text-slate-400">{item.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-white">#{item.train_number}</td>
                    <td className="py-2 px-3 text-amber-300 font-sans">{item.event_type}</td>
                    <td className="py-2 px-3">{item.severity}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{item.location}</td>
                    <td className="py-2 px-3">
                      <span className="text-slate-400">+{item.before_delay.toFixed(0)}m</span>
                      <ArrowRight className="w-2.5 h-2.5 inline mx-1 text-slate-500" />
                      <span className="text-rose-400 font-bold">+{item.after_delay.toFixed(0)}m</span>
                    </td>
                    <td className="py-2 px-3">
                      {item.is_active ? (
                        <span className="text-rose-400 font-semibold">Active</span>
                      ) : (
                        <span className="text-emerald-400">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
