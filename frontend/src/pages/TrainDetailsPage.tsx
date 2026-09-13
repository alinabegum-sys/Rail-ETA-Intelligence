import React from 'react';
import { 
  Train, ArrowRight, Gauge, Clock, ShieldAlert, 
  MapPin, CheckCircle2, AlertCircle, FastForward, Activity 
} from 'lucide-react';
import { TrainSummary, TrainETAForecast, TrainStop } from '../types';
import { RouteMap } from '../components/RouteMap';

interface TrainDetailsPageProps {
  train: TrainSummary | undefined;
  forecast: TrainETAForecast | null;
  stops: TrainStop[];
  onNavigateToForecast: () => void;
  onNavigateToSimulation: () => void;
}

export const TrainDetailsPage: React.FC<TrainDetailsPageProps> = ({
  train,
  forecast,
  stops,
  onNavigateToForecast,
  onNavigateToSimulation
}) => {
  if (!train || !forecast) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto animate-spin text-blue-400 mb-2" />
        <p>Loading train telemetry and dynamic forecast...</p>
      </div>
    );
  }

  // Calculate journey progress percentage
  const passedStopsCount = forecast.stops.filter(s => s.is_passed).length;
  const totalStopsCount = forecast.stops.length;
  const progressPct = totalStopsCount > 1 
    ? Math.round((passedStopsCount / (totalStopsCount - 1)) * 100) 
    : 0;

  const getStatusBadge = (status: string, delay: number) => {
    switch (status) {
      case 'on_time':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">On Time</span>;
      case 'minor_delay':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">Minor (+{delay.toFixed(0)}m)</span>;
      case 'moderate_delay':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">Moderate (+{delay.toFixed(0)}m)</span>;
      case 'major_delay':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">Major (+{delay.toFixed(0)}m)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Train Header Banner */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Train className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{train.train_name}</h1>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  #{train.train_number}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {train.train_type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center">
                <span>{train.source}</span>
                <ArrowRight className="w-3 h-3 mx-1.5 text-slate-500" />
                <span>{train.destination}</span>
                <span className="mx-2 text-slate-600">•</span>
                <span>Total Distance: {train.total_distance} km</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToForecast}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition shadow"
            >
              View Full ML Forecast Chart
            </button>
            <button
              onClick={onNavigateToSimulation}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold tracking-wide transition"
            >
              Simulate Disruption
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Current Section Speed</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-lg font-bold font-mono text-white">{train.speed.toFixed(0)} km/h</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Current Route Delay</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className={`text-lg font-bold font-mono ${
                train.current_delay_minutes > 20 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                +{train.current_delay_minutes.toFixed(0)} mins
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Upcoming Station</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-base font-bold text-white truncate">{train.next_station}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Predicted Destination ETA</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <FastForward className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-bold font-mono text-cyan-300">{train.predicted_final_eta}</span>
            </div>
          </div>
        </div>

        {/* Journey Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Route Traversal Progress</span>
            <span className="font-mono text-slate-200">{progressPct}% completed ({passedStopsCount}/{totalStopsCount} stations)</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Map + Route Stations Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Live Spatial Route Map</h2>
          <RouteMap stops={stops} train={train} selectedTrainId={train.train_id} />
        </div>

        {/* Upcoming Stations Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Station Timetable & Dynamic ETA Predictions
            </h2>
            <span className="text-xs text-slate-400">Calculated via dynamic ML model</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Seq</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Baseline ETA</th>
                  <th className="px-4 py-3">ML Predicted ETA</th>
                  <th className="px-4 py-3">Delay</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {forecast.stops.map((stop) => (
                  <tr
                    key={stop.sequence}
                    className={`transition ${
                      stop.is_next
                        ? 'bg-blue-950/50 border-l-4 border-blue-400'
                        : stop.is_passed
                        ? 'opacity-60 bg-slate-950/20'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {stop.is_passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : stop.is_next ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping"></span>
                      ) : (
                        `#${stop.sequence}`
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white text-xs">{stop.station_name}</div>
                      <div className="text-[10px] text-blue-400 font-mono">{stop.station_code}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-400">
                      {stop.distance_from_source} km
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-300">
                      {stop.scheduled_arrival}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-amber-400/90">
                      {stop.baseline_eta}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-cyan-300">
                      {stop.predicted_eta}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                      {stop.is_passed ? (
                        <span className="text-slate-500">Departed</span>
                      ) : (
                        <span className={stop.predicted_delay_minutes > 20 ? 'text-rose-400' : 'text-emerald-400'}>
                          +{stop.predicted_delay_minutes.toFixed(0)}m
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-300">
                      {stop.is_passed ? '--' : `${(stop.confidence_score * 100).toFixed(0)}%`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(stop.status, stop.predicted_delay_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
