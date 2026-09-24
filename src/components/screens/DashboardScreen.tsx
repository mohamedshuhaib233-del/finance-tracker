import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Bot,
  BarChart3,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Account, Budget, SavingsGoal, SmartNotification, Transaction } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface DashboardScreenProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  notifications: SmartNotification[];
  currencySymbol: string;
  onNavigate: (screen: string) => void;
  onQuickAction: (action: 'add_expense' | 'add_income' | 'transfer' | 'voice_entry' | 'ask_ai') => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  accounts,
  transactions,
  budgets,
  goals,
  notifications,
  currencySymbol,
  onNavigate,
  onQuickAction,
  onSelectTransaction,
}) => {
  // A1: Balance Calculations
  const bankBalances = accounts
    .filter((a) => a.type === 'bank' && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const cashBalance = accounts
    .filter((a) => a.type === 'cash' && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const upiBalances = accounts
    .filter((a) => a.type === 'upi_wallet' && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const creditCardOutstanding = accounts
    .filter((a) => a.type === 'credit_card' && !a.isArchived)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  const totalCashAvailable = bankBalances + cashBalance + upiBalances;
  const netWorth = totalCashAvailable - creditCardOutstanding;

  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Current month income & expenses
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

  const monthlyIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const potentialSurplus = monthlyIncome - monthlyExpenses;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const activeAlerts = notifications.filter((n) => !n.isRead).slice(0, 3);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Total Net Worth Hero Card */}
      <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 border border-emerald-600/30 text-white shadow-xl shadow-emerald-900/15 overflow-hidden">
        {/* Decorative emerald ambient glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-400/20 filter blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <Sparkles className="w-24 h-24 text-emerald-200" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
              Total Net Worth
            </span>
          </div>

          <div className="mt-2 text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            {currencySymbol}{netWorth.toLocaleString('en-IN')}
          </div>

          {/* Sub-breakdown of liquid vs debt */}
          <div className="mt-5 pt-3.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
              <span className="text-emerald-100 block text-[11px] font-medium">Available Cash</span>
              <span className="font-bold text-white text-sm font-display">
                {currencySymbol}{totalCashAvailable.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
              <span className="text-emerald-100 block text-[11px] font-medium">Credit Card Debt</span>
              <span className="font-bold text-red-200 text-sm font-display">
                {currencySymbol}{creditCardOutstanding.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="hidden sm:block bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
              <span className="text-emerald-100 block text-[11px] font-medium">Savings Goals</span>
              <span className="font-bold text-emerald-200 text-sm font-display">
                {currencySymbol}{totalSavings.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* A3: Quick Actions Row */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs uppercase font-bold tracking-wider text-pearl-400">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => onQuickAction('add_expense')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-navy-900/80 hover:bg-white/10 border border-white/10 hover:border-crimson-500/40 transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-crimson-500/20 text-crimson-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-pearl-200">Expense</span>
          </button>

          <button
            onClick={() => onQuickAction('add_income')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-navy-900/80 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-pearl-200">Income</span>
          </button>

          <button
            onClick={() => onQuickAction('transfer')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-navy-900/80 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-pearl-200">Transfer</span>
          </button>

          <button
            onClick={() => onQuickAction('ask_ai')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-navy-900/80 hover:bg-white/10 border border-white/10 hover:border-gold-500/40 transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-pearl-200">Ask AI</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-navy-900/80 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 text-pearl-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-medium text-pearl-200">Reports</span>
          </button>
        </div>
      </div>

      {/* A2: Financial Health Snapshot */}
      <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-400" />
            <h3 className="text-sm font-bold font-display text-pearl-50">Financial Snapshot</h3>
          </div>
          <button
            onClick={() => onNavigate('health')}
            className="text-xs text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1 transition-colors"
          >
            Health Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 py-2 border-y border-white/10 text-center">
          <div>
            <span className="text-[11px] text-pearl-400 block">Monthly Income</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-display">
              {currencySymbol}{monthlyIncome.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-pearl-400 block">Monthly Expenses</span>
            <span className="text-sm sm:text-base font-bold text-crimson-400 font-display">
              {currencySymbol}{monthlyExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-pearl-400 block">Potential Surplus</span>
            <span className="text-sm sm:text-base font-bold text-gold-400 font-display">
              {currencySymbol}{potentialSurplus.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="mt-3 bg-navy-800/60 rounded-xl p-3 text-xs text-pearl-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <div>
            <p className="leading-relaxed">
              Monthly surplus is <strong className="text-gold-300">{currencySymbol}{potentialSurplus.toLocaleString('en-IN')} ({Math.round((potentialSurplus / (monthlyIncome || 1)) * 100)}%)</strong>. Suggested action: Allocate <strong className="text-emerald-400">{currencySymbol}6,500</strong> to your Emergency Fund.
            </p>
          </div>
        </div>
      </div>

      {/* A4: Smart Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-wider text-pearl-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-gold-400" /> Alerts
            </h3>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-pearl-400 hover:text-pearl-200"
            >
              View All ({notifications.length})
            </button>
          </div>

          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onNavigate(alert.actionScreen || 'ai_coach')}
                className="p-3.5 rounded-2xl bg-navy-900/80 border border-gold-500/20 hover:border-gold-500/40 flex items-start justify-between gap-3 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-gold-400 mt-1.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-pearl-100">{alert.title}</h4>
                    <p className="text-xs text-pearl-300 mt-0.5 leading-snug">{alert.message}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pearl-400 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A1 (cont): Account Type Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs uppercase font-bold tracking-wider text-pearl-400">Accounts & Wallets</h3>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs text-gold-400 hover:text-gold-300 font-semibold"
          >
            Manage All ({accounts.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Bank Balances"
            value={`${currencySymbol}${bankBalances.toLocaleString('en-IN')}`}
            subValue="2 Accounts"
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => onNavigate('accounts')}
          />
          <StatCard
            label="Cash Wallet"
            value={`${currencySymbol}${cashBalance.toLocaleString('en-IN')}`}
            subValue="Physical"
            icon={<Wallet className="w-4 h-4" />}
            onClick={() => onNavigate('accounts')}
          />
          <StatCard
            label="UPI Wallets"
            value={`${currencySymbol}${upiBalances.toLocaleString('en-IN')}`}
            subValue="FastPay / Paytm"
            icon={<Smartphone className="w-4 h-4" />}
            onClick={() => onNavigate('accounts')}
          />
          <StatCard
            label="Card Outstanding"
            value={`${currencySymbol}${creditCardOutstanding.toLocaleString('en-IN')}`}
            subValue="Due in 15 days"
            icon={<CreditCard className="w-4 h-4" />}
            variant="default"
            onClick={() => onNavigate('accounts')}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500">Recent Transactions</h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {recentTransactions.length}
            </span>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No transactions recorded yet in this vault.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Tap below to record your first calculation or transaction.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => onQuickAction('add_income')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  + Add Income
                </button>
                <button
                  onClick={() => onQuickAction('add_expense')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                >
                  + Add Expense
                </button>
              </div>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer' || tx.type === 'credit_card_payment';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3.5 flex items-center justify-between hover:bg-emerald-50/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700'
                          : isExpense
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {tx.category}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {tx.subcategory && (
                          <>
                            <span className="text-slate-600 font-medium">{tx.subcategory}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{tx.date}</span>
                        {tx.isAutoPosted && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-medium">Auto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold font-display text-sm sm:text-base ${
                        isIncome
                          ? 'text-emerald-700'
                          : isExpense
                          ? 'text-slate-900'
                          : 'text-blue-700'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {currencySymbol}
                      {tx.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">{tx.currency}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
