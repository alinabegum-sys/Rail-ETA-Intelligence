import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, Cell 
} from 'recharts';
import { BarChart3, CheckCircle2, TrendingDown, Layers, Database, ShieldCheck } from 'lucide-react';
import { PerformanceAnalytics } from '../types';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPerformanceAnalytics()
      .then(data => setAnalytics(data))
      .catch(err => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Loading genuine machine learning evaluation metrics...</p>
      </div>
    );
  }

  const { model_metrics } = analytics;

  // Format feature importances for chart
  const featData = Object.entries(model_metrics.feature_importances)
    .map(([feature, importance]) => ({
      feature: feature.replace(/_/g, ' '),
      importance: Number((importance * 100).toFixed(1))
    }))
    .slice(0, 8); // Top 8 features

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">Machine Learning & Operational Analytics</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                HOLDOUT TEST SET METRICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rigorous comparative evaluation: Static Baseline vs Multi-Feature RandomForest Traversal Model
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Model: <span className="text-slate-200">{model_metrics.model_name}</span> | Samples: <span className="text-slate-200">{model_metrics.dataset_samples.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Model Benchmark KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Baseline MAE</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {model_metrics.baseline_mae.toFixed(2)} min
          </div>
          <span className="text-[10px] text-slate-500">Scheduled + Delay</span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-900/50 bg-blue-950/20">
          <span className="text-[10px] text-blue-400 uppercase font-medium block">ML Model MAE</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {model_metrics.ml_mae.toFixed(2)} min
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center mt-0.5">
            <TrendingDown className="w-3 h-3 mr-0.5" />
            {model_metrics.improvement_percent}% error cut
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Baseline RMSE</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {model_metrics.baseline_rmse.toFixed(2)} min
          </div>
          <span className="text-[10px] text-slate-500">Root Mean Sq Error</span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-900/50 bg-blue-950/20">
          <span className="text-[10px] text-blue-400 uppercase font-medium block">ML Model RMSE</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {model_metrics.ml_rmse.toFixed(2)} min
          </div>
          <span className="text-[10px] text-slate-500">Penalty on outliers</span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-900/50 bg-emerald-950/20">
          <span className="text-[10px] text-emerald-400 uppercase font-medium block">Coefficient of Det (R²)</span>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {model_metrics.ml_r2.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-400">Variance explained</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Evaluation Protocol</span>
          <div className="text-sm font-bold text-white mt-1">
            {model_metrics.train_test_split}
          </div>
          <span className="text-[10px] text-slate-500">20% Holdout Test</span>
        </div>
      </div>

      {/* Row 1 Charts: Baseline vs ML Error Horizon & Top Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline vs ML Error Across Travel Horizons */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Prediction Error (MAE) Across Distance Horizons
            </h3>
            <p className="text-xs text-slate-400">Comparing static lock vs ML dynamic forecasting across journey length</p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.error_comparison} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="horizon" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-10} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="m" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="baseline_mae" name="Baseline Error (MAE)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ml_mae" name="ML Model Error (MAE)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Feature Importances */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              RandomForest Gini Feature Importances (%)
            </h3>
            <p className="text-xs text-slate-400">Actual relative contribution of operational parameters to ETA regression</p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Relative Weight']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {featData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : index === 1 ? '#60a5fa' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Delay Distribution & Corridor Punctuality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Distribution */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Train Punctuality Distribution (Active Network)
            </h3>
            <p className="text-xs text-slate-400">Active trains categorized into punctuality tolerance brackets</p>
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.delay_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Trains Count" radius={[4, 4, 0, 0]}>
                  {analytics.delay_distribution.map((entry, index) => {
                    const color = entry.status === 'on_time' ? '#10b981' : entry.status === 'minor' ? '#06b6d4' : entry.status === 'moderate' ? '#f59e0b' : '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Corridor Analysis */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Corridor Historical Punctuality (%)
            </h3>
            <p className="text-xs text-slate-400">On-time adherence percentage across key trunk arteries</p>
          </div>

          <div className="space-y-3">
            {analytics.punctuality_breakdown.map((corridor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{corridor.corridor}</span>
                  <div className="space-x-3 font-mono">
                    <span className="text-emerald-400 font-bold">{corridor.punctuality_pct}%</span>
                    <span className="text-slate-400 text-[11px]">avg: +{corridor.avg_delay}m</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${corridor.punctuality_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
