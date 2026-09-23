import React from 'react';
import { Subscription, Account } from '../../types';
import { Sparkles, Plus, AlertCircle, CheckCircle2, Calendar, CreditCard, RotateCcw } from 'lucide-react';
import { Badge } from '../common/Badge';

interface SubscriptionsScreenProps {
  subscriptions: Subscription[];
  accounts: Account[];
  currencySymbol: string;
  onToggleSubscription: (subId: string, currentActive: boolean) => Promise<void>;
  onAddNewSubscription: () => void;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({
  subscriptions,
  accounts,
  currencySymbol,
  onToggleSubscription,
  onAddNewSubscription,
}) => {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const totalMonthlyCost = activeSubs.reduce(
    (sum, s) => sum + (s.frequency === 'yearly' ? s.cost / 12 : s.cost),
    0
  );
  const totalYearlyCost = totalMonthlyCost * 12;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Subscriptions</h2>
          <p className="text-xs text-pearl-400">Manage active subscriptions and recurring memberships</p>
        </div>
        <button
          onClick={onAddNewSubscription}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Subscription
        </button>
      </div>

      {/* Aggregate Cost Rollup Banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <span className="text-[11px] uppercase font-semibold text-pearl-400 block">
            Total Monthly Cost
          </span>
          <div className="text-xl font-bold font-display text-pearl-50 mt-1">
            {currencySymbol}{Math.round(totalMonthlyCost).toLocaleString('en-IN')}{' '}
            <span className="text-xs text-pearl-400 font-normal">/mo</span>
          </div>
          <span className="text-[10px] text-pearl-400 mt-1 block">
            {activeSubs.length} Active Services
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-gold-500/20 bg-gradient-to-br from-navy-900 to-gold-950/10">
          <span className="text-[11px] uppercase font-semibold text-gold-400 block">
            Annual Cumulative Cost
          </span>
          <div className="text-xl font-bold font-display text-gold-300 mt-1">
            {currencySymbol}{Math.round(totalYearlyCost).toLocaleString('en-IN')}{' '}
            <span className="text-xs text-pearl-400 font-normal">/yr</span>
          </div>
          <span className="text-[10px] text-pearl-400 mt-1 block">Annualized Run Rate</span>
        </div>
      </div>

      {/* AI Subscription Insight from Spec */}
      <div className="p-3.5 rounded-2xl bg-navy-900/90 border border-gold-500/30 text-xs text-pearl-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div className="leading-snug space-y-1">
          <p>
            You have <strong className="text-pearl-100">{activeSubs.length} active subscriptions</strong> costing approximately <strong className="text-gold-300">{currencySymbol}{Math.round(totalMonthlyCost).toLocaleString('en-IN')} per month</strong>.
          </p>
          <p className="text-[11px] text-pearl-400">
            <strong>AI Coach Notice:</strong> Review Gold’s Fitness membership. Last recorded activity was {'>'} 30 days ago.
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {subscriptions.map((sub) => {
          return (
            <div
              key={sub.id}
              className={`glass-card rounded-2xl p-4 border transition-all ${
                sub.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pearl-100 text-sm">{sub.name}</h4>
                    <Badge variant={sub.isActive ? 'emerald' : 'pearl'} size="sm">
                      {sub.isActive ? 'Active' : 'Cancelled'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-pearl-400 mt-0.5">
                    {accountMap.get(sub.accountId) || 'Payment Account'} • Renews: {sub.renewalDate}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-display text-pearl-50">
                    {currencySymbol}{sub.cost.toLocaleString('en-IN')}
                    <span className="text-[10px] text-pearl-400 font-normal">/{sub.frequency === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                  <span className="text-[10px] text-pearl-400">
                    Reminder: {sub.reminderDaysBefore} days before
                  </span>
                </div>
              </div>

              {sub.notes && (
                <div className="mt-2 text-[11px] text-gold-300 bg-navy-950/60 p-2 rounded-xl border border-white/5">
                  {sub.notes}
                </div>
              )}

              {/* Action Toggle */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-pearl-400 text-[11px]">{sub.category}</span>
                <button
                  onClick={() => onToggleSubscription(sub.id, sub.isActive)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    sub.isActive
                      ? 'bg-crimson-500/10 text-crimson-400 border-crimson-500/20 hover:bg-crimson-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  {sub.isActive ? 'Cancel / Pause' : 'Reactivate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
