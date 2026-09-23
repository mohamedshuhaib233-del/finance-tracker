import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import { RecurringRule } from '../../types';
import { Badge } from '../common/Badge';

interface BillsScreenProps {
  recurringRules: RecurringRule[];
  currencySymbol: string;
  onMarkPaid: (rule: RecurringRule) => void;
  onAddNewRule: () => void;
}

export const BillsScreen: React.FC<BillsScreenProps> = ({
  recurringRules,
  currencySymbol,
  onMarkPaid,
  onAddNewRule,
}) => {
  const expenseBills = recurringRules.filter((r) => r.type === 'expense');

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Bill Reminders</h2>
          <p className="text-xs text-pearl-400">Upcoming bill due dates and scheduled payments</p>
        </div>
        <button
          onClick={onAddNewRule}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs shadow-gold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Bill
        </button>
      </div>

      {/* Reminder Notice */}
      <div className="p-3.5 rounded-2xl bg-navy-900/90 border border-white/10 text-xs text-pearl-300 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <p className="leading-snug">
          Reminders alert you 2–5 days before due dates so you have sufficient balance.
        </p>
      </div>

      {/* Bill Reminders List */}
      <div className="space-y-3">
        {expenseBills.map((bill) => {
          return (
            <div
              key={bill.id}
              className="glass-card glass-card-hover rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 py-1.5 rounded-xl bg-navy-800 text-center border border-white/10 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-gold-400 block">DUE</span>
                  <span className="text-sm font-bold text-pearl-100 font-display">
                    {bill.nextOccurrence.slice(8)}th
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pearl-100 text-sm">{bill.name}</h4>
                    <Badge variant={bill.autoCreate ? 'gold' : 'pearl'} size="sm">
                      {bill.autoCreate ? 'Auto-Post' : 'Reminder Only'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-pearl-400 mt-0.5">
                    {bill.category} • Frequency: {bill.frequency}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="text-base font-bold font-display text-pearl-50">
                  {currencySymbol}{bill.amount.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onMarkPaid(bill)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
