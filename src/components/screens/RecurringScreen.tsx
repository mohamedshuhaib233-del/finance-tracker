import React, { useState } from 'react';
import { RecurringRule, Account } from '../../types';
import { Plus, Repeat, Check, ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';

interface RecurringScreenProps {
  recurringRules: RecurringRule[];
  accounts: Account[];
  currencySymbol: string;
  onToggleAutoCreate: (ruleId: string, current: boolean) => Promise<void>;
  onAddNewRecurring: () => void;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

export const RecurringScreen: React.FC<RecurringScreenProps> = ({
  recurringRules,
  accounts,
  currencySymbol,
  onToggleAutoCreate,
  onAddNewRecurring,
  onDeleteRule,
}) => {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Recurring Transactions</h2>
          <p className="text-xs text-pearl-400">Salary credits, rent, EMIs, and scheduled rules</p>
        </div>
        <button
          onClick={onAddNewRecurring}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Rule
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-2xl bg-navy-900/90 border border-white/10 text-xs text-pearl-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div className="leading-snug">
          Rules support two modes: <strong className="text-pearl-100">Reminder Only</strong> (alerts you to verify) and{' '}
          <strong className="text-pearl-100">Auto-Post</strong> (automatically records the transaction).
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {recurringRules.map((rule) => {
          const isIncome = rule.type === 'income';

          return (
            <div
              key={rule.id}
              className="glass-card rounded-2xl p-4 border border-white/10 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pearl-100 text-sm">{rule.name}</h4>
                    <Badge variant={isIncome ? 'emerald' : 'crimson'} size="sm">
                      {rule.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-pearl-400 mt-0.5">
                    {accountMap.get(rule.accountId) || 'Account'} • Next: {rule.nextOccurrence} ({rule.frequency})
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-base font-bold font-display ${
                      isIncome ? 'text-emerald-400' : 'text-pearl-50'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{currencySymbol}{rule.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-pearl-400 uppercase">{rule.frequency}</span>
                </div>
              </div>

              {/* Mode Toggle & Actions */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => onToggleAutoCreate(rule.id, rule.autoCreate)}
                  className="flex items-center gap-1.5 text-pearl-300 hover:text-pearl-100"
                >
                  {rule.autoCreate ? (
                    <span className="text-gold-400 font-semibold flex items-center gap-1">
                      <ToggleRight className="w-5 h-5 text-gold-400" /> Mode: Auto-Post
                    </span>
                  ) : (
                    <span className="text-pearl-400 flex items-center gap-1">
                      <ToggleLeft className="w-5 h-5 text-pearl-400" /> Mode: Reminder Only
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-pearl-400 hover:text-crimson-400 transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
