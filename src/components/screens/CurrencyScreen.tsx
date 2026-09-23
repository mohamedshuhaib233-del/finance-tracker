import React from 'react';
import { CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../db/seedData';
import { Check, Globe, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

interface CurrencyScreenProps {
  currentBaseCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => Promise<void>;
}

export const CurrencyScreen: React.FC<CurrencyScreenProps> = ({
  currentBaseCurrency,
  onSelectCurrency,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-pearl-50">Currency</h2>
        <p className="text-xs text-pearl-400">Select base currency and view exchange rates</p>
      </div>

      {/* Active Base Currency Banner */}
      <div className="glass-card rounded-2xl p-4 border border-gold-500/30 bg-gradient-to-br from-navy-900 to-gold-950/10 flex items-center justify-between shadow-gold">
        <div>
          <span className="text-[10px] uppercase font-bold text-gold-400 block tracking-wider">
            Current Base Currency
          </span>
          <div className="text-2xl font-bold font-display text-pearl-50 mt-0.5">
            {currentBaseCurrency} ({SUPPORTED_CURRENCIES.find((c) => c.code === currentBaseCurrency)?.symbol})
          </div>
        </div>
        <Badge variant="gold" size="md">Active Base</Badge>
      </div>

      {/* Currencies Table */}
      <div className="glass-card rounded-2xl divide-y divide-white/10 overflow-hidden">
        {SUPPORTED_CURRENCIES.map((curr) => {
          const isSelected = curr.code === currentBaseCurrency;

          return (
            <div
              key={curr.code}
              onClick={() => onSelectCurrency(curr.code)}
              className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center font-bold text-pearl-100 font-display text-base">
                  {curr.symbol}
                </div>
                <div>
                  <div className="font-bold text-pearl-100 text-sm flex items-center gap-2">
                    {curr.name} <span className="text-xs text-pearl-400">({curr.code})</span>
                  </div>
                  <span className="text-[11px] text-pearl-400">
                    1 {curr.code} = ₹{curr.exchangeRateToINR.toFixed(2)} INR
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-gold-500 text-navy-950 flex items-center justify-center shadow-gold">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
