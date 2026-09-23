import React from 'react';
import {
  ShieldCheck,
  Laptop,
  Plane,
  Briefcase,
  Plus,
  Sparkles,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SavingsGoal } from '../../types';
import { Badge } from '../common/Badge';

interface GoalsScreenProps {
  goals: SavingsGoal[];
  currencySymbol: string;
  onSelectGoal: (goal: SavingsGoal) => void;
  onAddNewGoal: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  currencySymbol,
  onSelectGoal,
  onAddNewGoal,
}) => {
  const getGoalIcon = (category?: string) => {
    switch (category) {
      case 'Safety':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Gadget':
        return <Laptop className="w-5 h-5 text-blue-400" />;
      case 'Vacation':
        return <Plane className="w-5 h-5 text-teal-400" />;
      case 'Wealth':
        return <Briefcase className="w-5 h-5 text-gold-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gold-400" />;
    }
  };

  const totalSavedAcrossGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetAcrossGoals = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const aggregateGoalProgress = totalTargetAcrossGoals > 0
    ? Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100)
    : 0;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Savings Goals</h2>
          <p className="text-xs text-pearl-400">Track and achieve your savings targets</p>
        </div>
        <button
          onClick={onAddNewGoal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> New Goal
        </button>
      </div>

      {/* Aggregate Goal Progress Banner */}
      <div className="glass-card rounded-2xl p-4 border border-gold-500/30 bg-gradient-to-br from-navy-900 via-navy-850 to-gold-950/20 shadow-gold">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-pearl-400 uppercase font-semibold">Total Saved</span>
          <span className="font-bold text-gold-300 font-display">
            {aggregateGoalProgress}% of total target
          </span>
        </div>

        <div className="text-2xl font-bold font-display text-pearl-50">
          {currencySymbol}{totalSavedAcrossGoals.toLocaleString('en-IN')}
          <span className="text-xs text-pearl-400 font-normal"> / {currencySymbol}{totalTargetAcrossGoals.toLocaleString('en-IN')}</span>
        </div>

        <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden my-3">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, aggregateGoalProgress)}%` }}
          />
        </div>

        <div className="text-[11px] text-pearl-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>{goals.filter((g) => g.status === 'active').length} active goals in progress.</span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-3">
        {goals.map((g) => {
          const pct = Math.round((g.currentAmount / g.targetAmount) * 100);

          // Calculate remaining months
          const today = new Date();
          const target = new Date(g.targetDate);
          const diffMonths = Math.max(
            1,
            (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
          );
          const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
          const recalculatedMonthly = Math.round(remainingAmount / diffMonths);

          return (
            <div
              key={g.id}
              onClick={() => onSelectGoal(g)}
              className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center">
                    {getGoalIcon(g.category)}
                  </div>
                  <div>
                    <h4 className="font-bold text-pearl-100 text-sm">{g.name}</h4>
                    <span className="text-[11px] text-pearl-400">Target: {g.targetDate} ({diffMonths} mos)</span>
                  </div>
                </div>

                <Badge
                  variant={g.priority === 'high' ? 'gold' : g.priority === 'medium' ? 'blue' : 'pearl'}
                  size="sm"
                >
                  {g.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>

              {/* Amount progress */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-pearl-300 font-medium">Saved: {currencySymbol}{g.currentAmount.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-pearl-100 font-display">{pct}%</span>
                </div>

                <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Spec Requirement: Smart Goal Insights */}
              <div className="p-2.5 rounded-xl bg-navy-800/60 border border-white/5 text-[11px] text-pearl-300 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  To reach your <strong>{currencySymbol}{g.targetAmount.toLocaleString('en-IN')}</strong> target in {diffMonths} months, contribute approximately <strong>{currencySymbol}{recalculatedMonthly.toLocaleString('en-IN')}/month</strong>.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
