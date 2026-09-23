import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  CreditCard,
  Smartphone,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  RotateCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Account, AccountType } from '../../types';
import { Badge } from '../common/Badge';

interface AccountsScreenProps {
  accounts: Account[];
  currencySymbol: string;
  onSelectAccount: (account: Account) => void;
  onOpenTransfer: () => void;
  onOpenReconcile: (account: Account) => void;
  onAddNewAccount: () => void;
}

export const AccountsScreen: React.FC<AccountsScreenProps> = ({
  accounts,
  currencySymbol,
  onSelectAccount,
  onOpenTransfer,
  onOpenReconcile,
  onAddNewAccount,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-gold-400" />;
      case 'upi_wallet':
        return <Smartphone className="w-5 h-5 text-teal-400" />;
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Accounts</h2>
          <p className="text-xs text-pearl-400">Manage bank accounts, cards, cash, and UPI wallets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pearl-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
          </button>
          <button
            onClick={onAddNewAccount}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add
          </button>
        </div>
      </div>

      {/* Assets vs Liabilities Rollup */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-gradient-to-br from-navy-900 to-emerald-950/10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-pearl-400">
            Total Assets
          </span>
          <div className="text-xl sm:text-2xl font-bold font-display text-emerald-400 mt-1">
            {currencySymbol}{totalAssets.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-pearl-400 mt-1 block">Bank + Cash + UPI Wallets</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-crimson-500/20 bg-gradient-to-br from-navy-900 to-crimson-950/10">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-pearl-400">
            Total Liabilities
          </span>
          <div className="text-xl sm:text-2xl font-bold font-display text-crimson-400 mt-1">
            {currencySymbol}{totalLiabilities.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-pearl-400 mt-1 block">Credit Card Outstanding</span>
        </div>
      </div>

      {/* Account Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {['all', 'bank', 'cash', 'credit_card', 'upi_wallet'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl font-medium capitalize shrink-0 transition-all ${
              filterType === type
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold'
                : 'bg-navy-900 border border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Accounts Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredAccounts.map((account) => {
          const isCard = account.type === 'credit_card';
          const utilizationPct = isCard && account.creditLimit
            ? Math.round((account.currentBalance / account.creditLimit) * 100)
            : 0;

          return (
            <div
              key={account.id}
              className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center">
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-pearl-100 text-sm">{account.name}</h4>
                      <span className="text-[11px] text-pearl-400">{account.institution}</span>
                    </div>
                  </div>

                  <Badge variant={isCard ? 'gold' : 'pearl'} size="sm">
                    {account.type.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>

                {/* Balance display */}
                <div className="mt-4">
                  <span className="text-[10px] text-pearl-400 uppercase tracking-wider block">
                    {isCard ? 'Current Outstanding Balance' : 'Available Balance'}
                  </span>
                  <div
                    className={`text-2xl font-bold font-display ${
                      isCard ? 'text-crimson-400' : 'text-pearl-50'
                    }`}
                  >
                    {currencySymbol}{account.currentBalance.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Credit card limit & billing details */}
                {isCard && account.creditLimit && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between text-pearl-400 text-[11px]">
                      <span>Limit Utilization ({utilizationPct}%)</span>
                      <span>Limit: {currencySymbol}{account.creditLimit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilizationPct > 40 ? 'bg-crimson-500' : 'bg-gold-500'
                        }`}
                        style={{ width: `${Math.min(100, utilizationPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-pearl-400 pt-1">
                      <span>Cycle: {account.billingCycleDay}th</span>
                      <span className="text-gold-400">Due: {account.paymentDueDay}th of month</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons on card: View & Reconcile */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenReconcile(account)}
                  className="flex items-center gap-1 text-gold-400 hover:text-gold-300 font-semibold"
                  title="Compare with real bank balance"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Reconcile
                </button>
                <button
                  onClick={() => onSelectAccount(account)}
                  className="flex items-center gap-1 text-pearl-300 hover:text-pearl-100 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
