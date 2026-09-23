import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Account, CurrencyCode } from '../../types';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface TransferMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultCurrency: CurrencyCode;
  onConfirmTransfer: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
    date: string;
  }) => Promise<void>;
}

export const TransferMoneyModal: React.FC<TransferMoneyModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultCurrency,
  onConfirmTransfer,
}) => {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);
  const isCreditCardSettlement = toAcc?.type === 'credit_card';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmTransfer({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        notes: notes || (isCreditCardSettlement ? 'Credit Card Bill Settlement' : 'Account-to-Account Transfer'),
        date,
      });
      setAmount('');
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreditCardSettlement ? 'Credit Card Settlement' : 'Transfer Capital'}
      subtitle="Moves liquidity between your own accounts"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Accounting Rule Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-xs text-pearl-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Critical Accounting Rule:</strong> Transfers between your own accounts never count
            as income or expenses. Settling a card reduces outstanding liability directly.
          </p>
        </div>

        {/* Transfer Visual Direction */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-semibold text-pearl-400 uppercase tracking-wider mb-1">
              Source Account (From)
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl p-2.5 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (₹{a.currentBalance.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-pearl-400 uppercase tracking-wider mb-1">
              Destination (To)
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl p-2.5 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.type === 'credit_card' ? '(Debt Settlement)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Transfer Amount *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-display font-bold text-gold-400 text-lg">
              ₹
            </span>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xl font-bold font-display text-pearl-50 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Execution Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Memo / Purpose
          </label>
          <input
            type="text"
            placeholder={isCreditCardSettlement ? 'Regalia monthly bill payment' : 'Emergency savings sweep'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
          />
        </div>

        {/* Action button */}
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
            {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
