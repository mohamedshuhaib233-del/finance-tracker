import React from 'react';
import { Modal } from '../common/Modal';
import { Budget, Transaction } from '../../types';
import { Sparkles, Calendar, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../common/Badge';

interface BudgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  transactions: Transaction[];
  currencySymbol: string;
  onDeleteBudget: (budgetId: string) => Promise<void>;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  isOpen,
  onClose,
  budget,
  transactions,
  currencySymbol,
  onDeleteBudget,
}) => {
  if (!budget) return null;

  const pct = Math.round((budget.spent / budget.amount) * 100);
  const isOver = budget.spent > budget.amount;
  const remaining = budget.amount - budget.spent;

  // Filter transactions in budget period matching category
  const matchingTxs = transactions
    .filter((t) => {
      if (budget.category !== 'All' && t.category !== budget.category) return false;
      return t.date >= budget.startDate && t.date <= budget.endDate;
    })
    .slice(0, 8);

  const handleDelete = async () => {
    if (window.confirm(`Delete budget "${budget.name}"?`)) {
      await onDeleteBudget(budget.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budget.name}
      subtitle={`${budget.category} • ${budget.type.toUpperCase()}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Spent vs Target Hero */}
        <div className="text-center p-5 rounded-3xl bg-navy-800/80 border border-white/10">
          <Badge variant={isOver ? 'crimson' : pct >= 80 ? 'gold' : 'emerald'} size="sm" className="mb-2">
            {pct}% Consumed
          </Badge>
          <div className="text-3xl font-extrabold font-display text-pearl-50">
            {currencySymbol}{budget.spent.toLocaleString('en-IN')}{' '}
            <span className="text-lg text-pearl-400 font-normal">/ {currencySymbol}{budget.amount.toLocaleString('en-IN')}</span>
          </div>

          <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden my-3">
            <div
              className={`h-full rounded-full ${
                isOver ? 'bg-crimson-500' : pct >= budget.alertThreshold ? 'bg-gold-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>

          <span
            className={`text-xs font-semibold ${
              isOver ? 'text-crimson-400' : 'text-emerald-400'
            }`}
          >
            {isOver
              ? `Exceeded planned limit by ${currencySymbol}${Math.abs(remaining).toLocaleString('en-IN')}`
              : `${currencySymbol}${remaining.toLocaleString('en-IN')} remaining until ${budget.endDate}`}
          </span>
        </div>

        {/* AI Insight */}
        {budget.aiSuggestions && (
          <div className="p-3.5 rounded-2xl bg-navy-800/60 border border-gold-500/30 text-xs text-pearl-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-gold-300">AI Spending Guidance:</strong>
              <p className="mt-0.5 leading-snug">{budget.aiSuggestions}</p>
            </div>
          </div>
        )}

        {/* Budget Rules Grid */}
        <div className="glass-card rounded-2xl divide-y divide-white/10 text-xs">
          <div className="p-3 flex justify-between">
            <span className="text-pearl-400">Budget Duration</span>
            <span className="font-semibold text-pearl-100">{budget.startDate} to {budget.endDate}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-pearl-400">Early Warning Alert Threshold</span>
            <span className="font-semibold text-gold-400">{budget.alertThreshold}% of total allowance</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-pearl-400">Carry Forward Surplus/Deficit?</span>
            <span className="font-bold text-pearl-100">{budget.carryForward ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Transactions in Period */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-pearl-400 mb-2">
            Related Transactions in Cycle ({matchingTxs.length})
          </h4>
          <div className="glass-card rounded-2xl divide-y divide-white/10 max-h-44 overflow-y-auto">
            {matchingTxs.length === 0 ? (
              <p className="p-4 text-xs text-center text-pearl-400">No matching transactions in this window.</p>
            ) : (
              matchingTxs.map((t) => (
                <div key={t.id} className="p-2.5 px-3.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-medium text-pearl-200">{t.notes || t.category}</div>
                    <div className="text-[10px] text-pearl-400">{t.date}</div>
                  </div>
                  <span className="font-bold font-display text-crimson-400">
                    -{currencySymbol}{t.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 font-semibold text-xs hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-3 rounded-xl bg-crimson-500/15 hover:bg-crimson-500/25 border border-crimson-500/30 text-crimson-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Budget
          </button>
        </div>
      </div>
    </Modal>
  );
};
