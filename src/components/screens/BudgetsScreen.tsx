import React, { useState } from 'react';
import {
  Plus,
  AlertTriangle,
  Sparkles,
  Calendar,
  ChevronRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Budget } from '../../types';
import { Badge } from '../common/Badge';

interface BudgetsScreenProps {
  budgets: Budget[];
  currencySymbol: string;
  onSelectBudget: (budget: Budget) => void;
  onAddNewBudget: () => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  currencySymbol,
  onSelectBudget,
  onAddNewBudget,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'custom'>('monthly');

  const filteredBudgets = budgets.filter((b) => b.type === activeTab);

  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Budgets</h2>
          <p className="text-xs text-pearl-400">Monthly limits and custom spending budgets</p>
        </div>
        <button
          onClick={onAddNewBudget}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> New Budget
        </button>
      </div>

      {/* Monthly vs Custom Tabs */}
      <div className="grid grid-cols-2 p-1 bg-navy-900/90 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'monthly'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
              : 'text-pearl-400 hover:text-pearl-200'
          }`}
        >
          Monthly Budgets
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'custom'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
              : 'text-pearl-400 hover:text-pearl-200'
          }`}
        >
          Custom Budgets (Trips, Events)
        </button>
      </div>

      {/* Aggregate Spend Progress Card */}
      <div className="glass-card rounded-2xl p-4 border border-white/10">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-pearl-400 uppercase font-semibold">Total {activeTab} Consumption</span>
          <span className="font-bold text-pearl-100 font-display">
            {overallPercentage}% ({currencySymbol}{totalSpent.toLocaleString('en-IN')} / {currencySymbol}{totalAllocated.toLocaleString('en-IN')})
          </span>
        </div>

        <div className="w-full h-2.5 bg-navy-950 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage > 100
                ? 'bg-crimson-500'
                : overallPercentage > 80
                ? 'bg-gold-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-pearl-400 mt-2">
          <span>Remaining Allowance: {currencySymbol}{Math.max(0, totalAllocated - totalSpent).toLocaleString('en-IN')}</span>
          <span>{filteredBudgets.length} Active Targets</span>
        </div>
      </div>

      {/* Budget Cards List */}
      <div className="space-y-3">
        {filteredBudgets.map((b) => {
          const pct = Math.round((b.spent / b.amount) * 100);
          const isOver = b.spent > b.amount;
          const remaining = b.amount - b.spent;

          return (
            <div
              key={b.id}
              onClick={() => onSelectBudget(b)}
              className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pearl-100 text-sm">{b.name}</h4>
                    {isOver && (
                      <Badge variant="crimson" size="sm">
                        Exceeded
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-pearl-400">{b.category}</span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-display text-pearl-100">
                    {currencySymbol}{b.spent.toLocaleString('en-IN')} <span className="text-pearl-400 font-normal">/ {currencySymbol}{b.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isOver ? 'text-crimson-400' : 'text-emerald-400'
                    }`}
                  >
                    {isOver
                      ? `Budget exceeded by ${currencySymbol}${Math.abs(remaining).toLocaleString('en-IN')}`
                      : `${currencySymbol}${remaining.toLocaleString('en-IN')} remaining`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isOver
                      ? 'bg-crimson-500'
                      : pct >= b.alertThreshold
                      ? 'bg-gold-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              {/* AI Coaching Suggestion if present */}
              {b.aiSuggestions && (
                <div className="p-2.5 rounded-xl bg-navy-800/80 border border-gold-500/20 text-xs text-pearl-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                  <p className="leading-snug text-[11px]">{b.aiSuggestions}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
