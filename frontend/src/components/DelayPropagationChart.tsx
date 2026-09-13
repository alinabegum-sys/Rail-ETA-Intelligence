import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { StationETAPrediction } from '../types';

interface DelayPropagationChartProps {
  stops: StationETAPrediction[];
}

export const DelayPropagationChart: React.FC<DelayPropagationChartProps> = ({ stops }) => {
  const chartData = stops.map((s, idx) => {
    const prevDelay = idx > 0 ? stops[idx - 1].predicted_delay_minutes : 0;
    const sectionChange = s.is_passed ? 0 : Number((s.predicted_delay_minutes - prevDelay).toFixed(1));

    return {
      station: s.station_code,
      fullName: s.station_name,
      predictedDelay: s.is_passed ? 0 : s.predicted_delay_minutes,
      sectionDelta: sectionChange,
      isPassed: s.is_passed,
      isNext: s.is_next,
      status: s.status
    };
  });

  const getBarColor = (item: any) => {
    if (item.isPassed) return '#334155';
    if (item.predictedDelay <= 5) return '#10b981';
    if (item.predictedDelay <= 20) return '#06b6d4';
    if (item.predictedDelay <= 45) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Delay Propagation Through Route</h3>
          <p className="text-xs text-slate-400">Cumulative expected delay at each subsequent junction (minutes)</p>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="station" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="m" />
            <Tooltip 
              formatter={(value: any, name: string, item: any) => [
                `${value} min (${item.payload.sectionDelta >= 0 ? '+' : ''}${item.payload.sectionDelta}m section change)`,
                'Delay'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload.length) {
                  return `${payload[0].payload.fullName} (${label})`;
                }
                return label;
              }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
            />
            <Bar dataKey="predictedDelay" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-3 text-[11px] text-slate-400">
        <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm mr-1.5"></span> ≤5m (On Time)</span>
        <span className="flex items-center"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm mr-1.5"></span> 6-20m (Minor)</span>
        <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm mr-1.5"></span> 21-45m (Moderate)</span>
        <span className="flex items-center"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm mr-1.5"></span> &gt;45m (Major)</span>
      </div>
    </div>
  );
};
