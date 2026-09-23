import React from 'react';
import { HealthIndicator } from '../../types';
import { Badge } from '../common/Badge';
import { ShieldCheck, ArrowRight, HelpCircle, Sparkles, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface FinancialHealthScreenProps {
  indicators: HealthIndicator[];
  onNavigateBack?: () => void;
  onTakeAction?: (action: string) => void;
}

export const FinancialHealthScreen: React.FC<FinancialHealthScreenProps> = ({
  indicators,
  onNavigateBack,
  onTakeAction,
}) => {
  const getStatusBadge = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'optimal':
        return <Badge variant="emerald" size="sm">Optimal</Badge>;
      case 'good':
        return <Badge variant="blue" size="sm">Healthy</Badge>;
      case 'warning':
        return <Badge variant="gold" size="sm">Attention Needed</Badge>;
      case 'critical':
        return <Badge variant="crimson" size="sm">Action Required</Badge>;
    }
  };

  const getStatusBorder = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'optimal':
        return 'border-emerald-500/30';
      case 'good':
        return 'border-blue-500/30';
      case 'warning':
        return 'border-gold-500/30';
      case 'critical':
        return 'border-crimson-500/40';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-pearl-50">Financial Health</h2>
        <p className="text-xs text-pearl-400 mt-0.5">
          Key performance indicators for savings, expenses, and liquidity.
        </p>
      </div>

      {/* 9 Indicators Grid */}
      <div className="space-y-3">
        {indicators.map((ind) => (
          <div
            key={ind.id}
            className={`glass-card rounded-2xl p-4 border ${getStatusBorder(
              ind.status
            )} space-y-3 transition-all`}
          >
            {/* Top Row: Name, Category, Value, Badge */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-pearl-100 text-sm">{ind.name}</h4>
                  {getStatusBadge(ind.status)}
                </div>
                <span className="text-[10px] text-pearl-400 uppercase tracking-wider">
                  {ind.category} • {ind.benchmark}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold font-display text-pearl-50">
                  {ind.displayValue}
                </span>
              </div>
            </div>

            {/* What it Measures & Explanation */}
            <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5 space-y-1.5 text-xs">
              <div className="text-pearl-400 text-[11px] leading-relaxed">
                <strong className="text-pearl-200">What it measures:</strong> {ind.whatItMeasures}
              </div>
              <div className="text-pearl-300 leading-relaxed">
                <strong className="text-gold-300">Live diagnosis:</strong> {ind.explanation}
              </div>
            </div>

            {/* Suggested Action */}
            <div className="flex items-start justify-between gap-3 text-xs pt-1">
              <div className="flex items-start gap-1.5 text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Suggested Action:</strong> {ind.suggestedAction}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
