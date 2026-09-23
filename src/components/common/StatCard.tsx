import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'gold' | 'emerald' | 'navy';
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'default',
  className,
  onClick,
}) => {
  const borderVariants = {
    default: 'border-white/10 hover:border-gold-500/30',
    gold: 'border-gold-500/30 bg-gradient-to-br from-navy-900/90 via-navy-850/90 to-gold-950/20 shadow-gold',
    emerald: 'border-emerald-500/30 bg-gradient-to-br from-navy-900/90 to-emerald-950/20',
    navy: 'border-navy-700/60 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-800/80',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-card rounded-2xl p-4 transition-all duration-300 relative overflow-hidden',
        borderVariants[variant],
        onClick && 'cursor-pointer hover:translate-y-[-2px]',
        className
      )}
    >
      {/* Subtle top glare */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-pearl-400 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-gold-400/90">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold font-display text-pearl-50 tracking-tight">
          {value}
        </span>
      </div>

      {(subValue || trend) && (
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          {trend && (
            <span
              className={clsx(
                'font-semibold flex items-center gap-0.5',
                trend.isPositive ? 'text-emerald-400' : 'text-crimson-400'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subValue && <span className="text-pearl-400 truncate">{subValue}</span>}
        </div>
      )}
    </div>
  );
};
