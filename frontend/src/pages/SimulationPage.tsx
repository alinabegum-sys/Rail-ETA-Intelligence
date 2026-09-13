import React from 'react';
import { Activity, Sparkles, MapPin } from 'lucide-react';
import { TrainSummary, TrainETAForecast, TrainStop, OperationalEvent, EventHistoryItem } from '../types';
import { SimulationControlPanel } from '../components/SimulationControlPanel';
import { RouteMap } from '../components/RouteMap';
import { ETALineChart } from '../components/ETALineChart';

interface SimulationPageProps {
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
  forecast: TrainETAForecast | null;
  stops: TrainStop[];
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
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
  eventHistory,
  forecast,
  stops
}) => {
  const selectedTrain = trains.find(t => t.train_id === selectedTrainId) || trains[0];

  return (
    <div className="space-y-6">
      {/* Simulation Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Interactive Simulation Control Room</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900 text-cyan-300 font-bold border border-cyan-700">
                SIMULATED REAL-TIME MODE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Perturb train kinematics with signal delays, caution orders, and weather to observe real-time dynamic ETA recalculation
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Control Cockpit & Event Injector */}
      <SimulationControlPanel
        isRunning={isRunning}
        onStart={onStart}
        onPause={onPause}
        onStep={onStep}
        onReset={onReset}
        trains={trains}
        selectedTrainId={selectedTrainId}
        onSelectTrain={onSelectTrain}
        onInjectEvent={onInjectEvent}
        onResolveEvent={onResolveEvent}
        activeEvents={activeEvents}
        eventHistory={eventHistory}
      />

      {/* Spatial Map and Dynamic Recalculation Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Simulated Route Traversal ({selectedTrain?.train_number})</span>
            </h2>
            <span className="text-xs text-slate-400">Updates position on step</span>
          </div>
          <RouteMap stops={stops} train={selectedTrain} selectedTrainId={selectedTrainId} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Downstream ETA Recalculation Curve</span>
            </h2>
            <span className="text-xs text-slate-400">Live ML Recalculation</span>
          </div>
          {forecast && <ETALineChart stops={forecast.stops} />}
        </div>
      </div>
    </div>
  );
};
