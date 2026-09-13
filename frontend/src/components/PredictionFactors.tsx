import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info, AlertTriangle, CloudRain, Gauge, Compass } from 'lucide-react';
import { PredictionFactor } from '../types';

interface PredictionFactorsProps {
  factors: PredictionFactor[];
  modelConfidence: number;
}

export const PredictionFactors: React.FC<PredictionFactorsProps> = ({ factors, modelConfidence }) => {
  const getIconForFactor = (name: string) => {
    if (name.includes('Weather')) return CloudRain;
    if (name.includes('Speed') || name.includes('Incident')) return AlertTriangle;
    if (name.includes('Congestion')) return Compass;
    return Gauge;
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">Prediction Factors</h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/40">
              Interpretable Attributions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent feature contribution decomposition driving the dynamic ETA forecast
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Ensemble Confidence</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {(modelConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {factors.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No extraordinary disruption factors detected. Operating under nominal schedule profile.
          </div>
        ) : (
          factors.map((factor, idx) => {
            const isDelayIncrease = factor.impact_direction === 'increases_delay';
            const Icon = getIconForFactor(factor.name);

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border transition ${
                  isDelayIncrease
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    : 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-md ${
                      isDelayIncrease ? 'bg-slate-800 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{factor.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">{factor.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 font-mono text-xs font-bold pl-3 flex-shrink-0">
                    {isDelayIncrease ? (
                      <span className="text-rose-400 flex items-center">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        +{factor.impact_minutes.toFixed(1)}m
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center">
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        -{factor.impact_minutes.toFixed(1)}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center">
          <Info className="w-3 h-3 mr-1 text-slate-400" />
          Feature influences are derived from actual model regression weights and operational inputs.
        </span>
        <span className="font-mono text-slate-400">RandomForest v1.0-rf</span>
      </div>
    </div>
  );
};
