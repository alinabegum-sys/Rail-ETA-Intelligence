import React from 'react';
import { Cpu, ArrowRight, Train, FastForward, Clock } from 'lucide-react';
import { TrainSummary, TrainETAForecast } from '../types';
import { ETALineChart } from '../components/ETALineChart';
import { DelayPropagationChart } from '../components/DelayPropagationChart';
import { PredictionFactors } from '../components/PredictionFactors';

interface ETAForecastPageProps {
  train: TrainSummary | undefined;
  forecast: TrainETAForecast | null;
  trains: TrainSummary[];
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
}

export const ETAForecastPage: React.FC<ETAForecastPageProps> = ({
  train,
  forecast,
  trains,
  selectedTrainId,
  onSelectTrain
}) => {
  if (!train || !forecast) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Loading dynamic ETA forecast models...</p>
      </div>
    );
  }

  const upcomingStops = forecast.stops.filter(s => !s.is_passed);
  const terminusStop = forecast.stops[forecast.stops.length - 1];

  return (
    <div className="space-y-6">
      {/* Header with train switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Dynamic ETA Forecast Engine
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              INFERENCE ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Station-by-station ML regression vs static naive baseline propagation for #{train.train_number}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Switch Train:</label>
          <select
            value={selectedTrainId}
            onChange={(e) => onSelectTrain(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-500 outline-none"
          >
            {trains.map(t => (
              <option key={t.train_id} value={t.train_id}>
                {t.train_number} - {t.train_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-xs text-slate-400 block uppercase font-medium">Scheduled Timetable Terminus</span>
          <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
            {terminusStop ? terminusStop.scheduled_arrival : '--:--'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Static master schedule at zero deviation</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20">
          <span className="text-xs text-amber-400 block uppercase font-medium">Naive Baseline ETA</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1 flex items-baseline space-x-2">
            <span>{terminusStop ? terminusStop.baseline_eta : '--:--'}</span>
            <span className="text-xs font-normal text-amber-400/80">(+{train.current_delay_minutes.toFixed(0)}m)</span>
          </div>
          <p className="text-[11px] text-amber-400/70 mt-1">Static formula: Scheduled + Current Delay</p>
        </div>

        <div className="p-4 rounded-xl border border-cyan-900/40 bg-cyan-950/20">
          <span className="text-xs text-cyan-400 block uppercase font-medium">ML Dynamically Forecasted ETA</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1 flex items-baseline space-x-2">
            <span>{terminusStop ? terminusStop.predicted_eta : '--:--'}</span>
            <span className="text-xs font-normal text-cyan-400/80">(+{terminusStop ? terminusStop.predicted_delay_minutes.toFixed(0) : 0}m)</span>
          </div>
          <p className="text-[11px] text-cyan-400/70 mt-1">
            Adaptive model accounting for section physics & recovery
          </p>
        </div>
      </div>

      {/* Main ETA Line Chart */}
      <ETALineChart stops={forecast.stops} />

      {/* Delay Propagation and Explainability Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DelayPropagationChart stops={forecast.stops} />
        <PredictionFactors factors={forecast.factors} modelConfidence={upcomingStops[0]?.confidence_score || 0.9} />
      </div>
    </div>
  );
};
