import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { StationETAPrediction } from '../types';

interface ETALineChartProps {
  stops: StationETAPrediction[];
}

export const ETALineChart: React.FC<ETALineChartProps> = ({ stops }) => {
  // Filter out already passed stations or format for chart
  const chartData = stops.map(s => ({
    name: s.station_code,
    fullName: s.station_name,
    scheduledDelay: 0,
    baselineDelay: s.is_passed ? 0 : s.baseline_delay_minutes,
    mlPredictedDelay: s.is_passed ? 0 : s.predicted_delay_minutes,
    confidence: (s.confidence_score * 100).toFixed(0) + '%',
    scheduledArrival: s.scheduled_arrival,
    predictedETA: s.predicted_eta,
    baselineETA: s.baseline_eta,
    isPassed: s.is_passed
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-100 text-sm">{data.fullName} ({data.name})</p>
          <div className="text-slate-400">Scheduled: <span className="text-white font-mono">{data.scheduledArrival}</span></div>
          <div className="text-amber-400">Baseline ETA (+Delay): <span className="font-mono font-semibold">{data.baselineETA} (+{data.baselineDelay}m)</span></div>
          <div className="text-cyan-400">ML Predicted ETA: <span className="font-mono font-semibold">{data.predictedETA} (+{data.mlPredictedDelay}m)</span></div>
          <div className="text-emerald-400">Model Confidence: <span className="font-mono font-semibold">{data.confidence}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">Dynamic ETA Forecast Comparison</h3>
          <p className="text-xs text-slate-400">Comparing Scheduled Timetable vs Naive Baseline vs ML Dynamic Traversal</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <span className="flex items-center text-slate-400">
            <span className="w-3 h-0.5 bg-slate-500 mr-1.5 inline-block"></span> Scheduled
          </span>
          <span className="flex items-center text-amber-400">
            <span className="w-3 h-0.5 bg-amber-500 mr-1.5 inline-block"></span> Baseline (Static Delay)
          </span>
          <span className="flex items-center text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-400 mr-1.5 inline-block"></span> ML Dynamic Prediction
          </span>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              unit="m"
              label={{ value: 'Delay (mins)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} 
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Scheduled reference line */}
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />

            {/* Scheduled Delay (0 baseline) */}
            <Line 
              type="monotone" 
              dataKey="scheduledDelay" 
              stroke="#475569" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={false}
              name="Scheduled Schedule"
            />

            {/* Baseline Delay Line */}
            <Line 
              type="stepAfter" 
              dataKey="baselineDelay" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              dot={{ stroke: '#f59e0b', strokeWidth: 1.5, r: 3, fill: '#0f172a' }}
              name="Baseline ETA"
            />

            {/* ML Dynamic Prediction Line */}
            <Line 
              type="monotone" 
              dataKey="mlPredictedDelay" 
              stroke="#06b6d4" 
              strokeWidth={3} 
              dot={{ stroke: '#06b6d4', strokeWidth: 2, r: 4, fill: '#0891b2' }}
              activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 2 }}
              name="ML Dynamic ETA"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <span><b>Scheduled:</b> Zero deviation reference timetable</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span><b>Baseline:</b> Rigidly locks current delay across all future stops</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span><b>ML Model:</b> Predicts slack recovery or cascading bottleneck shock</span>
        </div>
      </div>
    </div>
  );
};
