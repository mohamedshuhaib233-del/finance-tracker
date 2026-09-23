import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Account, Budget, RecurringRule, Subscription, Transaction } from '../../types';
import { Badge } from '../common/Badge';

interface ReportsScreenProps {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  subscriptions: Subscription[];
  recurringRules: RecurringRule[];
  currencySymbol: string;
  onOpenExportModal: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  transactions,
  accounts,
  budgets,
  subscriptions,
  recurringRules,
  currencySymbol,
  onOpenExportModal,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'income_vs_expense' | 'breakdown' | 'savings_trend' | 'cash_flow_calendar' | 'net_worth'
  >('income_vs_expense');

  // Net Worth Calculation
  const assets = accounts
    .filter((a) => a.type !== 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const liabilities = accounts
    .filter((a) => a.type === 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);
  const netWorth = assets - liabilities;

  // Category breakdown calculation
  const categoryTotals: { [cat: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExpense = categoryEntries.reduce((sum, [, amt]) => sum + amt, 0) || 1;

  // Dynamic monthly trends
  const monthlyTrends = React.useMemo(() => {
    if (transactions.length === 0) {
      return [
        { month: 'Jun', income: 0, expense: 0, savings: 0 },
        { month: 'Jul', income: 0, expense: 0, savings: 0 },
        { month: 'Aug', income: 0, expense: 0, savings: 0 },
        { month: 'Sep', income: 0, expense: 0, savings: 0 },
      ];
    }
    const months = ['06', '07', '08', '09'];
    const monthNames = ['Jun', 'Jul', 'Aug', 'Sep'];
    return months.map((m, idx) => {
      const txs = transactions.filter((t) => t.date.includes(`-${m}-`));
      const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: monthNames[idx], income: inc, expense: exp, savings: Math.max(0, inc - exp) };
    });
  }, [transactions]);

  // Dynamic cash flow timeline items
  const timelineEvents = React.useMemo(() => {
    const events: Array<{ date: string; title: string; amount: number; type: string; tag: string }> = [];
    recurringRules.filter((r) => r.status === 'active').forEach((r) => {
      events.push({
        date: r.nextOccurrence || 'Upcoming',
        title: r.name,
        amount: r.amount,
        type: r.type,
        tag: r.category,
      });
    });
    subscriptions.filter((s) => s.isActive).forEach((s) => {
      events.push({
        date: s.renewalDate || 'Upcoming',
        title: s.name,
        amount: s.cost,
        type: 'expense',
        tag: 'Subscription',
      });
    });
    return events;
  }, [recurringRules, subscriptions]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Reports & Analytics</h2>
          <p className="text-xs text-pearl-400">Income, spending breakdowns, and net worth</p>
        </div>
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pearl-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-gold-400" /> Export
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-navy-900/90 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar text-xs font-semibold">
        {[
          { id: 'income_vs_expense', label: 'Income vs Expense' },
          { id: 'breakdown', label: 'Category Breakdown' },
          { id: 'savings_trend', label: 'Savings Trend' },
          { id: 'cash_flow_calendar', label: 'Cash Flow' },
          { id: 'net_worth', label: 'Net Worth' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
              activeReportTab === tab.id
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'text-pearl-400 hover:text-pearl-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 10.1 Income vs Expenses Monthly Trends */}
      {activeReportTab === 'income_vs_expense' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold font-display text-pearl-100">Monthly Inflow vs Outflow</h3>
                <span className="text-[11px] text-pearl-400">Comparison across last 4 billing cycles</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Inflow
                </span>
                <span className="flex items-center gap-1.5 text-crimson-400">
                  <div className="w-2.5 h-2.5 rounded-sm bg-crimson-500" /> Outflow
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-around h-48 border-b border-white/10 px-2 gap-4">
                {monthlyTrends.map((t) => {
                  const maxAmt = 80000;
                  const incomeHeight = Math.round((t.income / maxAmt) * 160);
                  const expenseHeight = Math.round((t.expense / maxAmt) * 160);

                  return (
                    <div key={t.month} className="flex flex-col items-center gap-2 flex-1">
                      <div className="flex items-end gap-1.5 h-40">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${incomeHeight}px` }}
                          className="w-5 sm:w-8 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md relative group cursor-pointer transition-all hover:brightness-110"
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-navy-950 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/30 whitespace-nowrap z-10">
                            {currencySymbol}{t.income / 1000}k
                          </div>
                        </div>
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expenseHeight}px` }}
                          className="w-5 sm:w-8 bg-gradient-to-t from-crimson-600 to-crimson-400 rounded-t-md relative group cursor-pointer transition-all hover:brightness-110"
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-navy-950 px-1.5 py-0.5 rounded text-[9px] font-mono text-crimson-300 border border-crimson-500/30 whitespace-nowrap z-10">
                            {currencySymbol}{t.expense / 1000}k
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-pearl-300">{t.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10.2 Expense Breakdown */}
      {activeReportTab === 'breakdown' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold font-display text-pearl-100">Category Expense Outflow</h3>

            <div className="space-y-3">
              {categoryEntries.map(([category, amount]) => {
                const pct = Math.round((amount / totalExpense) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-pearl-200">{category}</span>
                      <span className="font-display font-bold text-pearl-100">
                        {currencySymbol}{amount.toLocaleString('en-IN')}{' '}
                        <span className="text-pearl-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-500 to-amber-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 10.3 Savings Trend */}
      {activeReportTab === 'savings_trend' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold font-display text-pearl-100">Historical Savings Trajectory</h3>
            <p className="text-xs text-pearl-400">Monthly surplus conserved after all real expenditures</p>

            <div className="pt-4 flex items-end justify-between h-40 border-b border-white/10 px-4">
              {monthlyTrends.map((t) => {
                const height = Math.round((t.savings / 35000) * 120);
                return (
                  <div key={t.month} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold font-display text-emerald-400">
                      {currencySymbol}{t.savings.toLocaleString('en-IN')}
                    </span>
                    <div
                      style={{ height: `${height}px` }}
                      className="w-10 bg-gradient-to-t from-gold-600 via-gold-400 to-amber-300 rounded-t-lg"
                    />
                    <span className="text-xs font-semibold text-pearl-300">{t.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 10.4 Cash Flow Calendar Timeline */}
      {activeReportTab === 'cash_flow_calendar' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-bold font-display text-pearl-100 mb-1">
              Anticipated Inflow & Outflow Timeline
            </h3>
            <p className="text-xs text-pearl-400">Fixed commitments, salary, and renewals</p>
          </div>

          <div className="glass-card rounded-2xl divide-y divide-white/10 overflow-hidden">
            {timelineEvents.map((ev, i) => {
              const isIncome = ev.type === 'income';
              const isTransfer = ev.type === 'transfer';

              return (
                <div key={i} className="p-3.5 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 py-1 rounded-xl bg-navy-800 text-center border border-white/10">
                      <span className="text-[10px] font-bold text-gold-400 uppercase block">{ev.date.slice(0, 3)}</span>
                      <span className="text-sm font-bold text-pearl-100 font-display">{ev.date.slice(4)}</span>
                    </div>

                    <div>
                      <div className="font-semibold text-pearl-100 text-sm">{ev.title}</div>
                      <Badge variant={isIncome ? 'emerald' : isTransfer ? 'blue' : 'pearl'} size="sm">
                        {ev.tag}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold font-display ${
                        isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-crimson-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{currencySymbol}{ev.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10.5 Net Worth */}
      {activeReportTab === 'net_worth' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-gold-500/30 bg-gradient-to-br from-navy-900 to-navy-850 space-y-4 shadow-gold">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-pearl-400">Total Net Worth</span>
                <div className="text-3xl font-extrabold font-display text-pearl-50 mt-1">
                  {currencySymbol}{netWorth.toLocaleString('en-IN')}
                </div>
              </div>
              <Badge variant="gold" size="md">Assets − Liabilities</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-navy-950/70 border border-emerald-500/30">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Real Assets</span>
                <span className="text-lg font-bold font-display text-pearl-50">
                  +{currencySymbol}{assets.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-pearl-400 block mt-0.5">Bank, Cash & UPI Wallets</span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/70 border border-crimson-500/30">
                <span className="text-[10px] uppercase font-bold text-crimson-400 block">Total Real Liabilities</span>
                <span className="text-lg font-bold font-display text-crimson-400">
                  -{currencySymbol}{liabilities.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-pearl-400 block mt-0.5">Credit Card Debt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
