import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Account } from '../../types';
import { RotateCw, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface ReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  currencySymbol: string;
  onConfirmReconcile: (accountId: string, actualBalance: number, notes?: string) => Promise<void>;
}

export const ReconcileModal: React.FC<ReconcileModalProps> = ({
  isOpen,
  onClose,
  account,
  currencySymbol,
  onConfirmReconcile,
}) => {
  const [actualBalanceInput, setActualBalanceInput] = useState(
    account ? account.currentBalance.toString() : ''
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!account) return null;

  const actualNum = parseFloat(actualBalanceInput) || 0;
  const recordedNum = account.currentBalance;
  const difference = actualNum - recordedNum;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmReconcile(account.id, actualNum, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Reconciliation"
      subtitle={`Verify recorded ledger against ${account.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-navy-800/80 border border-white/10 text-xs text-pearl-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Compare your real bank/wallet balance right now. Any difference will be logged as an
            automatic reconciliation adjustment to preserve mathematical integrity.
          </p>
        </div>

        {/* Current Recorded Balance */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-pearl-400 uppercase tracking-wider block">
              Recorded App Balance
            </span>
            <div className="text-xl font-bold font-display text-pearl-50">
              {currencySymbol}{recordedNum.toLocaleString('en-IN')}
            </div>
          </div>
          <span className="text-xs text-pearl-400 font-mono">Current Ledger</span>
        </div>

        {/* Actual Statement Balance Input */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Actual Real Balance (from bank statement or wallet) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-display font-bold text-gold-400 text-lg">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              required
              value={actualBalanceInput}
              onChange={(e) => setActualBalanceInput(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xl font-bold font-display text-pearl-50 focus:outline-none focus:border-gold-500"
              autoFocus
            />
          </div>
        </div>

        {/* Calculated Discrepancy Diff */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
            Math.abs(difference) < 0.01
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-gold-500/10 border-gold-500/30 text-gold-300'
          }`}
        >
          <div>
            <span className="font-semibold block">
              {Math.abs(difference) < 0.01
                ? 'Balances Match Perfectly!'
                : difference > 0
                ? 'Surplus Adjustment Required'
                : 'Deficit Adjustment Required'}
            </span>
            <span className="text-[11px] opacity-80">
              {Math.abs(difference) < 0.01
                ? 'No adjustment transaction needed.'
                : `A ${currencySymbol}${Math.abs(difference).toLocaleString('en-IN')} adjustment entry will be generated.`}
            </span>
          </div>
          <div className="text-base font-bold font-display">
            {difference >= 0 ? '+' : ''}{currencySymbol}{difference.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Correction Reason / Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly interest credit or missed cash transaction"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 font-semibold text-xs hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-gold hover:opacity-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSubmitting ? 'Updating...' : 'Save Reconciled Balance'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
