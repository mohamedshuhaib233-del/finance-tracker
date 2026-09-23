import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Account, Transaction } from '../../types';
import { Trash2, Receipt, AlertCircle, Check, ArrowRight, Shield } from 'lucide-react';
import { Badge } from '../common/Badge';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  currencySymbol: string;
  onDelete: (txId: string) => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  accounts,
  currencySymbol,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const srcAccount = accounts.find((a) => a.id === transaction.accountId);
  const destAccount = accounts.find((a) => a.id === transaction.toAccountId);

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer' || transaction.type === 'credit_card_payment';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction? The account balance will be automatically reversed.')) {
      setIsDeleting(true);
      try {
        await onDelete(transaction.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Record"
      subtitle={`Reference: ${transaction.id}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Amount Hero Badge */}
        <div className="text-center p-6 rounded-3xl bg-navy-800/80 border border-white/10 relative overflow-hidden">
          <Badge
            variant={isIncome ? 'emerald' : isExpense ? 'crimson' : 'blue'}
            size="md"
            className="mb-2 uppercase"
          >
            {transaction.type.replace(/_/g, ' ')}
          </Badge>

          <div
            className={`text-3xl sm:text-4xl font-extrabold font-display ${
              isIncome ? 'text-emerald-400' : isExpense ? 'text-pearl-50' : 'text-blue-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {currencySymbol}
            {transaction.amount.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-pearl-400 font-mono mt-1 block">
            {transaction.currency} • Recorded on {transaction.date}
          </span>
        </div>

        {/* Accounting Rule Notice */}
        {isTransfer && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-pearl-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-300">Accounting Integrity Rule:</strong> Transfers between
              your own accounts and credit card bill payoffs are excluded from income and expense calculations.
            </div>
          </div>
        )}

        {/* Ledger Details Grid */}
        <div className="glass-card rounded-2xl divide-y divide-white/10 text-xs">
          <div className="p-3 flex items-center justify-between">
            <span className="text-pearl-400">Category</span>
            <span className="font-semibold text-pearl-100">{transaction.category}</span>
          </div>

          {transaction.subcategory && (
            <div className="p-3 flex items-center justify-between">
              <span className="text-pearl-400">Subcategory</span>
              <span className="font-semibold text-pearl-100">{transaction.subcategory}</span>
            </div>
          )}

          <div className="p-3 flex items-center justify-between">
            <span className="text-pearl-400">{isTransfer ? 'Origin Account' : 'Account'}</span>
            <span className="font-semibold text-pearl-100">{srcAccount?.name || 'Account'}</span>
          </div>

          {destAccount && (
            <div className="p-3 flex items-center justify-between">
              <span className="text-pearl-400">Destination Account</span>
              <span className="font-semibold text-pearl-100">{destAccount.name}</span>
            </div>
          )}

          {transaction.notes && (
            <div className="p-3 flex flex-col gap-1">
              <span className="text-pearl-400">Notes / Merchant</span>
              <span className="text-pearl-200 text-sm font-medium">{transaction.notes}</span>
            </div>
          )}

          {transaction.tags && transaction.tags.length > 0 && (
            <div className="p-3 flex items-center justify-between">
              <span className="text-pearl-400">Tags</span>
              <div className="flex flex-wrap gap-1">
                {transaction.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-navy-700 text-gold-300 text-[11px]">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {transaction.isAutoPosted && (
            <div className="p-3 flex items-center justify-between">
              <span className="text-pearl-400">Creation Method</span>
              <span className="text-gold-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Auto-Posted by Recurring Rule
              </span>
            </div>
          )}
        </div>

        {/* Receipt Verification */}
        {transaction.receiptUrl && (
          <div className="p-3.5 rounded-2xl bg-navy-800/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-pearl-200">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Digital Receipt Proof Attached</span>
            </div>
            <Badge variant="emerald" size="sm">Verified</Badge>
          </div>
        )}

        {/* Actions: Delete with balance reversal */}
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
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-4 py-3 rounded-xl bg-crimson-500/15 hover:bg-crimson-500/25 border border-crimson-500/30 text-crimson-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Reversing...' : 'Delete & Reverse Balance'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
