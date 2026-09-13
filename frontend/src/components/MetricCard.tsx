import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'crimson' | 'cyan' | 'purple';
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-950/20 border-blue-900/40 text-blue-400',
      iconBg: 'bg-blue-600/20 text-blue-400',
      badge: 'bg-blue-900/40 text-blue-300'
    },
    emerald: {
      bg: 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400',
      iconBg: 'bg-emerald-600/20 text-emerald-400',
      badge: 'bg-emerald-900/40 text-emerald-300'
    },
    amber: {
      bg: 'bg-amber-950/20 border-amber-900/40 text-amber-400',
      iconBg: 'bg-amber-600/20 text-amber-400',
      badge: 'bg-amber-900/40 text-amber-300'
    },
    crimson: {
      bg: 'bg-rose-950/20 border-rose-900/40 text-rose-400',
      iconBg: 'bg-rose-600/20 text-rose-400',
      badge: 'bg-rose-900/40 text-rose-300'
    },
    cyan: {
      bg: 'bg-cyan-950/20 border-cyan-900/40 text-cyan-400',
      iconBg: 'bg-cyan-600/20 text-cyan-400',
      badge: 'bg-cyan-900/40 text-cyan-300'
    },
    purple: {
      bg: 'bg-purple-950/20 border-purple-900/40 text-purple-400',
      iconBg: 'bg-purple-600/20 text-purple-400',
      badge: 'bg-purple-900/40 text-purple-300'
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div className={`p-4 rounded-xl border ${style.bg} backdrop-blur-sm relative overflow-hidden transition hover:border-slate-600/60`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline space-x-2 mt-1.5">
            <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
            {trend && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${style.badge}`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${style.iconBg} self-start`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
