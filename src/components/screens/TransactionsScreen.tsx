import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Download,
  Calendar,
  Tag,
  Plus,
} from 'lucide-react';
import { Account, Transaction, TransactionType } from '../../types';

interface TransactionsScreenProps {
  transactions: Transaction[];
  accounts: Account[];
  currencySymbol: string;
  onSelectTransaction: (tx: Transaction) => void;
  onAddNew: () => void;
  onExport: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  accounts,
  currencySymbol,
  onSelectTransaction,
  onAddNew,
  onExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'transfer') {
          if (tx.type !== 'transfer' && tx.type !== 'credit_card_payment') return false;
        } else if (tx.type !== typeFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCategory = tx.category?.toLowerCase().includes(q);
        const matchSubcategory = tx.subcategory?.toLowerCase().includes(q);
        if (!matchCategory && !matchSubcategory) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, searchQuery]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header with Title & Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Transactions</h2>
          <p className="text-xs text-pearl-400">All income, expenses, and account transfers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="p-2 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-pearl-200 hover:text-gold-300 transition-colors"
            title="Export CSV / PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-pearl-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-navy-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-pearl-100 placeholder-pearl-400 focus:outline-none focus:border-gold-500/50 transition-colors"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {(['all', 'expense', 'income'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setTypeFilter(filter)}
            className={`px-3 py-1.5 rounded-xl font-medium capitalize shrink-0 transition-all ${
              typeFilter === filter
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold'
                : 'bg-navy-900 border border-white/10 text-pearl-400 hover:text-pearl-200'
            }`}
          >
            {filter === 'all' ? 'All Transactions' : `${filter}s`}
          </button>
        ))}
      </div>

      {/* Ledger Totals Ticker */}
      <div className="p-3 rounded-2xl bg-navy-900/60 border border-white/10 flex items-center justify-around text-center text-xs">
        <div>
          <span className="text-pearl-400 block text-[10px]">Income Total</span>
          <span className="font-bold text-emerald-400 font-display">
            +{currencySymbol}{totalFilteredIncome.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div>
          <span className="text-pearl-400 block text-[10px]">Expense Total</span>
          <span className="font-bold text-crimson-400 font-display">
            -{currencySymbol}{totalFilteredExpense.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div>
          <span className="text-pearl-400 block text-[10px]">Net Ledger Flow</span>
          <span
            className={`font-bold font-display ${
              totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-gold-400' : 'text-crimson-400'
            }`}
          >
            {currencySymbol}{(totalFilteredIncome - totalFilteredExpense).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-pearl-400">
            <p className="text-sm">No transactions found matching your filter criteria.</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, txs]) => (
            <div key={date} className="space-y-1.5">
              <div className="text-[11px] font-semibold text-pearl-400 uppercase tracking-wider px-1">
                {date}
              </div>

              <div className="glass-card rounded-2xl divide-y divide-white/10 overflow-hidden">
                {txs.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer' || tx.type === 'credit_card_payment';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isExpense
                              ? 'bg-crimson-500/20 text-crimson-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                          ) : isExpense ? (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>

                        <div>
                          <div className="font-semibold text-pearl-100 text-sm">
                            {tx.category}
                          </div>
                          <div className="text-[11px] text-pearl-400 flex items-center gap-1.5">
                            {tx.subcategory && (
                              <>
                                <span>{tx.subcategory}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{tx.date}</span>
                            {tx.isAutoPosted && (
                              <span className="text-[10px] text-gold-400 bg-gold-500/10 px-1 rounded">Auto</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold font-display text-sm ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-pearl-100'
                              : 'text-blue-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {currencySymbol}
                          {tx.amount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-pearl-400 uppercase">{tx.currency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
