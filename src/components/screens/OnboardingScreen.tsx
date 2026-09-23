import React, { useState } from 'react';
import { Crown, Check, ArrowRight, ShieldCheck, Sparkles, Globe, Wallet } from 'lucide-react';
import { CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../db/seedData';

interface OnboardingScreenProps {
  onComplete: (settings: { baseCurrency: CurrencyCode; pin?: string; userName: string }) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('User');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('INR');
  const [setupPin, setSetupPin] = useState(false);
  const [pin, setPin] = useState('0000');

  const handleFinish = () => {
    onComplete({
      baseCurrency: selectedCurrency,
      userName,
      pin: setupPin ? pin : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-pearl-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-2xl relative">
        {/* Crown Accent */}
        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-gold-500/40 flex items-center justify-center mb-6 shadow-gold mx-auto">
          <Crown className="w-7 h-7 text-gold-400" />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-gold-400' : 'w-2 bg-navy-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome & Currency */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">Welcome to Finance Tracker</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Track your expenses, manage budgets, and get smart financial insights.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. User"
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-pearl-100 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gold-400" /> Primary Currency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_CURRENCIES.slice(0, 6).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCurrency(c.code)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedCurrency === c.code
                        ? 'bg-gold-500/20 border-gold-500/60 text-gold-300 font-bold'
                        : 'bg-navy-800/60 border-white/10 text-pearl-300 hover:border-white/25'
                    }`}
                  >
                    <div className="text-base">{c.symbol}</div>
                    <div className="text-[10px] text-pearl-400">{c.code}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 text-xs font-semibold hover:bg-white/5 transition-all"
              >
                Skip Setup
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-gold hover:opacity-95 transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Privacy & Offline Principle */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">Private & Offline</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Your data stays on your device. No bank login required.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-navy-800/60 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-pearl-100">Offline Storage</span>
                  <p className="text-pearl-400 mt-0.5">All your data is stored locally in your browser.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-navy-800/60 border border-white/10">
                <Sparkles className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-pearl-100">AI Money Coach</span>
                  <p className="text-pearl-400 mt-0.5">Get spending analysis, budgets, and savings recommendations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-navy-800/60 border border-white/10">
                <Wallet className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-pearl-100">Voice & Manual Entry</span>
                  <p className="text-pearl-400 mt-0.5">Quickly log transactions by voice or text.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-white/10 text-pearl-300 text-xs font-semibold hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-gold hover:opacity-95 transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security / PIN Pad */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">App Security</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Add an optional PIN to protect your financial data.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-navy-800/60 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-pearl-100">Enable 4-Digit Security PIN</span>
                <p className="text-xs text-pearl-400">Lock the app when closed</p>
              </div>
              <input
                type="checkbox"
                checked={setupPin}
                onChange={(e) => setSetupPin(e.target.checked)}
                className="w-5 h-5 accent-gold-500 rounded cursor-pointer"
              />
            </div>

            {setupPin && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider">
                  Set 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-navy-800 border border-gold-500/50 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-gold-300 focus:outline-none"
                  placeholder="••••"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
