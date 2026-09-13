import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FastForward, ArrowRight } from 'lucide-react';
import { TrainSummary } from '../types';

interface TrainTableProps {
  trains: TrainSummary[];
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
  onViewDetails?: (trainId: string) => void;
}

export const TrainTable: React.FC<TrainTableProps> = ({
  trains,
  selectedTrainId,
  onSelectTrain,
  onViewDetails
}) => {
  const getStatusBadge = (status: string, delay: number) => {
    switch (status) {
      case 'on_time':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            On Time
          </span>
        );
      case 'minor_delay':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            <Clock className="w-3 h-3 mr-1 text-cyan-400" />
            Minor (+{delay.toFixed(0)}m)
          </span>
        );
      case 'moderate_delay':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <Clock className="w-3 h-3 mr-1 text-amber-400" />
            Moderate (+{delay.toFixed(0)}m)
          </span>
        );
      case 'major_delay':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-400" />
            Critical (+{delay.toFixed(0)}m)
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
          <tr>
            <th scope="col" className="px-4 py-3">Train</th>
            <th scope="col" className="px-4 py-3">Route</th>
            <th scope="col" className="px-4 py-3">Speed</th>
            <th scope="col" className="px-4 py-3">Current Delay</th>
            <th scope="col" className="px-4 py-3">Next Station</th>
            <th scope="col" className="px-4 py-3">ML Predicted Terminus</th>
            <th scope="col" className="px-4 py-3">Disruption / Event</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {trains.map((train) => {
            const isSelected = train.train_id === selectedTrainId;
            return (
              <tr
                key={train.train_id}
                onClick={() => onSelectTrain(train.train_id)}
                className={`transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950/40 border-l-4 border-blue-500 hover:bg-blue-950/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Train Name & Number */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <span>{train.train_number}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{train.train_name}</div>
                  <div className="text-[10px] text-blue-400/80 font-mono mt-0.5">{train.train_type}</div>
                </td>

                {/* Route */}
                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-300">
                  <div className="font-medium text-slate-200">{train.source}</div>
                  <div className="text-slate-500 text-[11px] flex items-center">
                    <span>to</span>
                    <ArrowRight className="w-2.5 h-2.5 mx-1 text-slate-500" />
                    <span className="text-slate-300">{train.destination}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{train.total_distance} km</div>
                </td>

                {/* Speed */}
                <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-slate-200">
                  <span className="font-semibold text-blue-400">{train.speed.toFixed(0)}</span> km/h
                </td>

                {/* Current Delay */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="font-mono text-sm font-semibold">
                    {train.current_delay_minutes <= 0 ? (
                      <span className="text-emerald-400">0 min</span>
                    ) : (
                      <span className={train.current_delay_minutes > 30 ? 'text-rose-400' : 'text-amber-400'}>
                        +{train.current_delay_minutes.toFixed(0)} min
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">Depart: {train.scheduled_start}</div>
                </td>

                {/* Next Station */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="text-xs font-semibold text-slate-200">{train.next_station}</div>
                  <div className="text-[10px] text-slate-400">
                    From: {train.current_station || 'Origin section'}
                  </div>
                </td>

                {/* Predicted ETA */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                    <FastForward className="w-3 h-3 text-cyan-400" />
                    <span>{train.predicted_final_eta}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Delay: +{train.predicted_final_delay.toFixed(0)} min
                  </div>
                </td>

                {/* Disruption / Event */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {train.has_active_event ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/70 text-rose-300 border border-rose-800/50">
                      ⚠️ {train.event_type}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Normal Track</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {getStatusBadge(train.status, train.current_delay_minutes)}
                </td>

                {/* Action */}
                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewDetails) onViewDetails(train.train_id);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-md transition"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
