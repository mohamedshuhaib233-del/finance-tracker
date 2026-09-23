import React from 'react';
import { Modal } from '../common/Modal';
import { Account, Transaction } from '../../types';
import { Badge } from '../common/Badge';
import { RotateCw, ShieldCheck, Building2, Calendar, CreditCard } from 'lucide-react';

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  transactions: Transaction[];
  currencySymbol: string;
  onReconcile: (account: Account) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  transactions,
  currencySymbol,
  onReconcile,
}) => {
  if (!account) return null;

  const isCard = account.type === 'credit_card';
  const accountTxs = transactions
    .filter((t) => t.accountId === account.id || t.toAccountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account.name}
      subtitle={`${account.institution} • ${account.type.toUpperCase()}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Balance Card */}
        <div className="text-center p-6 rounded-3xl bg-navy-800/80 border border-white/10 relative overflow-hidden">
          <Badge variant={isCard ? 'crimson' : 'gold'} size="sm" className="mb-2 uppercase">
            {isCard ? 'Current Outstanding Debt' : 'Verified Balance'}
          </Badge>
          <div className="text-3xl sm:text-4xl font-extrabold font-display text-pearl-50">
            {currencySymbol}{account.currentBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-pearl-400 font-mono mt-1 block">
            Opening Balance: {currencySymbol}{account.openingBalance.toLocaleString('en-IN')}
          </span>

          {account.lastReconciledAt && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Reconciled on {new Date(account.lastReconciledAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Card Specifics */}
        {isCard && (
          <div className="glass-card rounded-2xl p-4 divide-y divide-white/10 text-xs">
            <div className="pb-2 flex justify-between">
              <span className="text-pearl-400">Credit Limit</span>
              <span className="font-bold text-pearl-100">
                {currencySymbol}{(account.creditLimit || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-pearl-400">Billing Cycle Statement Date</span>
              <span className="font-semibold text-pearl-200">{account.billingCycleDay}th of each month</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-pearl-400">Payment Due Date</span>
              <span className="font-semibold text-gold-400">{account.paymentDueDay}th of each month</span>
            </div>
          </div>
        )}

        {/* Account Parameters */}
        <div className="glass-card rounded-2xl divide-y divide-white/10 text-xs">
          <div className="p-3 flex justify-between">
            <span className="text-pearl-400">Include in Net Worth Calculation?</span>
            <span className="font-bold text-emerald-400">{account.includeInNetWorth ? 'Yes' : 'No'}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-pearl-400">Account Status</span>
            <Badge variant="pearl" size="sm">Active</Badge>
          </div>
        </div>

        {/* Recent Ledger for this Account */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-pearl-400 mb-2">
            Recent Account Activity ({accountTxs.length})
          </h4>
          <div className="glass-card rounded-2xl divide-y divide-white/10 max-h-48 overflow-y-auto">
            {accountTxs.length === 0 ? (
              <p className="p-4 text-xs text-center text-pearl-400">No recorded transactions for this account.</p>
            ) : (
              accountTxs.map((tx) => (
                <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-pearl-200">{tx.notes || tx.category}</div>
                    <div className="text-[10px] text-pearl-400">{tx.date} • {tx.type}</div>
                  </div>
                  <div className="font-bold font-display text-pearl-100">
                    {currencySymbol}{tx.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action button */}
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
            onClick={() => {
              onClose();
              onReconcile(account);
            }}
            className="flex-1 py-3 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-4 h-4" /> Reconcile Balance
          </button>
        </div>
      </div>
    </Modal>
  );
};
