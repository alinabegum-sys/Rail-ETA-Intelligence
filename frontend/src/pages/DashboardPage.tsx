import React from 'react';
import { 
  Train, CheckCircle2, Clock, AlertTriangle, 
  Activity, BarChart2, MapPin, ArrowRight 
} from 'lucide-react';
import { TrainSummary, TrainStop, ModelMetrics } from '../types';
import { MetricCard } from '../components/MetricCard';
import { TrainTable } from '../components/TrainTable';
import { RouteMap } from '../components/RouteMap';

interface DashboardPageProps {
  trains: TrainSummary[];
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
  onViewDetails: (trainId: string) => void;
  stops: TrainStop[];
  metrics: ModelMetrics | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  trains,
  selectedTrainId,
  onSelectTrain,
  onViewDetails,
  stops,
  metrics
}) => {
  const totalTrains = trains.length;
  const onTimeCount = trains.filter(t => t.current_delay_minutes <= 5.0).length;
  const delayedCount = trains.filter(t => t.current_delay_minutes > 5.0 && t.current_delay_minutes <= 30.0).length;
  const criticalCount = trains.filter(t => t.current_delay_minutes > 30.0).length;
  const avgDelay = totalTrains > 0
    ? (trains.reduce((acc, t) => acc + t.current_delay_minutes, 0) / totalTrains).toFixed(1)
    : '0.0';

  const selectedTrain = trains.find(t => t.train_id === selectedTrainId) || trains[0];

  // Calculate approximate journey progress for selected train
  let progressPct = 40;
  if (selectedTrain && stops.length > 1) {
    const nextIdx = stops.findIndex(s => s.station_name === selectedTrain.next_station || s.station_code === selectedTrain.next_station);
    if (nextIdx > 0) {
      progressPct = Math.round((nextIdx / (stops.length - 1)) * 100);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Central Railway Control Room Overview</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
              LIVE NETWORK
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous adaptive ETA monitoring across Indian Railways high-density coaching corridors
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Active Trains"
          value={totalTrains}
          subtitle="Monitored Corridors"
          icon={Train}
          variant="blue"
        />
        <MetricCard
          title="On Time"
          value={onTimeCount}
          subtitle="≤ 5 min deviation"
          icon={CheckCircle2}
          variant="emerald"
          trend={`${totalTrains > 0 ? ((onTimeCount/totalTrains)*100).toFixed(0) : 0}%`}
        />
        <MetricCard
          title="Moderate Delay"
          value={delayedCount}
          subtitle="6 - 30 min buffer"
          icon={Clock}
          variant="amber"
        />
        <MetricCard
          title="Critical Delays"
          value={criticalCount}
          subtitle="> 30 min caution"
          icon={AlertTriangle}
          variant="crimson"
        />
        <MetricCard
          title="Network Avg Delay"
          value={`+${avgDelay}m`}
          subtitle="Dynamic Mean"
          icon={Activity}
          variant="purple"
        />
        <MetricCard
          title="Model Test MAE"
          value={metrics ? `±${metrics.ml_mae}m` : '±2.46m'}
          subtitle={metrics ? `${metrics.improvement_percent}% over baseline` : 'Dynamic Forecast'}
          icon={BarChart2}
          variant="cyan"
          trend="RandomForest"
        />
      </div>

      {/* Geographic Map and Selected Corridor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Corridor Map: {selectedTrain?.train_name} ({selectedTrain?.train_number})</span>
            </h2>
            <span className="text-xs text-slate-400">Click any table row to switch train</span>
          </div>
          <RouteMap stops={stops} train={selectedTrain} selectedTrainId={selectedTrainId} />
        </div>

        {/* Selected Train Inspector Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">Selected Telemetry</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedTrain?.train_name}</h3>
                <p className="text-xs text-slate-400 font-mono">Train #{selectedTrain?.train_number} • {selectedTrain?.train_type}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                selectedTrain?.current_delay_minutes > 20
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : selectedTrain?.current_delay_minutes > 5
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                +{selectedTrain?.current_delay_minutes.toFixed(0)} min
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Origin / Destination</span>
                <span className="text-slate-200 font-medium text-right truncate max-w-[180px]">{selectedTrain?.source} → {selectedTrain?.destination}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Current Velocity</span>
                <span className="text-blue-400 font-mono font-bold">{selectedTrain?.speed.toFixed(1)} km/h</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Current Location</span>
                <span className="text-slate-200">{selectedTrain?.current_station || 'Departed Origin'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Approaching Junction</span>
                <span className="text-amber-300 font-medium">{selectedTrain?.next_station}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">ML Predicted Terminus ETA</span>
                <span className="text-cyan-400 font-mono font-bold">{selectedTrain?.predicted_final_eta} (+{selectedTrain?.predicted_final_delay.toFixed(0)}m)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Active Perturbation</span>
                <span className="text-slate-200 truncate max-w-[180px]">
                  {selectedTrain?.has_active_event ? `⚠️ ${selectedTrain.event_type}` : 'None (Clear section)'}
                </span>
              </div>

              {/* Journey Progress */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Route Traversal</span>
                  <span className="font-mono text-slate-200">{progressPct}% completed</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800">
            <button
              onClick={() => onViewDetails(selectedTrain.train_id)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>Open Full Train Telemetry & Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Train Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Train className="w-4 h-4 text-cyan-400" />
            <span>ACTIVE TRAINS LIVE TRACKING STATUS</span>
          </h2>
          <span className="text-xs text-slate-400">Updated every simulation step</span>
        </div>
        <TrainTable
          trains={trains}
          selectedTrainId={selectedTrainId}
          onSelectTrain={onSelectTrain}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
};
