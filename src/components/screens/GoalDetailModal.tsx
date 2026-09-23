import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Account, SavingsGoal } from '../../types';
import { Sparkles, Calendar, Plus, Minus, Check, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import confetti from 'canvas-confetti';

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  accounts: Account[];
  currencySymbol: string;
  onUpdateGoalAmount: (goalId: string, delta: number) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  isOpen,
  onClose,
  goal,
  accounts,
  currencySymbol,
  onUpdateGoalAmount,
  onDeleteGoal,
}) => {
  const [deltaInput, setDeltaInput] = useState('');
  const [isDepositing, setIsDepositing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!goal) return null;

  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  const linkedAcc = accounts.find((a) => a.id === goal.linkedAccountId);

  // Recalculate monthly target
  const today = new Date();
  const target = new Date(goal.targetDate);
  const diffMonths = Math.max(
    1,
    (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
  );
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyRequired = Math.round(remainingAmount / diffMonths);

  const handleApplyDelta = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(deltaInput);
    if (!val || val <= 0) return;

    setIsProcessing(true);
    try {
      const delta = isDepositing ? val : -val;
      await onUpdateGoalAmount(goal.id, delta);

      if (isDepositing && goal.currentAmount + val >= goal.targetAmount) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setDeltaInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete goal "${goal.name}"?`)) {
      await onDeleteGoal(goal.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal.name}
      subtitle={`Linked Account: ${linkedAcc?.name || 'Primary Bank'}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Progress Display */}
        <div className="text-center p-5 rounded-3xl bg-navy-800/80 border border-white/10">
          <Badge variant={pct >= 100 ? 'emerald' : 'gold'} size="sm" className="mb-2">
            {pct}% Funded
          </Badge>
          <div className="text-3xl font-extrabold font-display text-pearl-50">
            {currencySymbol}{goal.currentAmount.toLocaleString('en-IN')}{' '}
            <span className="text-lg text-pearl-400 font-normal">/ {currencySymbol}{goal.targetAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>

          <span className="text-xs text-pearl-300 font-medium">
            {currencySymbol}{remainingAmount.toLocaleString('en-IN')} left to achieve by {goal.targetDate}
          </span>
        </div>

        {/* Dynamic Insight Recalculator */}
        <div className="p-3.5 rounded-2xl bg-navy-800/60 border border-gold-500/25 text-xs text-pearl-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-300">Smart Target Recalculation:</strong>
            <p className="mt-0.5 leading-snug">
              To reach your target in {diffMonths} remaining months, maintain monthly contributions of{' '}
              <strong className="text-pearl-100">{currencySymbol}{monthlyRequired.toLocaleString('en-IN')}/month</strong>{' '}
              (assuming no withdrawals).
            </p>
          </div>
        </div>

        {/* Quick Deposit / Withdraw Form */}
        <form onSubmit={handleApplyDelta} className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-pearl-400">
              Update Goal Reserves
            </span>
            <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setIsDepositing(true)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isDepositing
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-pearl-400'
                }`}
              >
                + Deposit
              </button>
              <button
                type="button"
                onClick={() => setIsDepositing(false)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  !isDepositing
                    ? 'bg-crimson-500/20 text-crimson-300 border border-crimson-500/30'
                    : 'text-pearl-400'
                }`}
              >
                - Withdraw
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-gold-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="Amount..."
                value={deltaInput}
                onChange={(e) => setDeltaInput(e.target.value)}
                className="w-full bg-navy-800 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              {isDepositing ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 font-semibold text-xs hover:bg-white/5 transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-3 rounded-xl bg-crimson-500/15 hover:bg-crimson-500/25 border border-crimson-500/30 text-crimson-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Goal
          </button>
        </div>
      </div>
    </Modal>
  );
};
