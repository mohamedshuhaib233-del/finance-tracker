import React, { useState } from 'react';
import { Crown, Check, ArrowRight, ShieldCheck, Sparkles, Globe, Lock, Fingerprint, AlertCircle } from 'lucide-react';
import { CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../db/seedData';

interface OnboardingScreenProps {
  onComplete: (settings: {
    baseCurrency: CurrencyCode;
    pin: string;
    userName: string;
    enableBiometrics?: boolean;
  }) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('INR');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(true);

  const handleStep1Next = () => {
    if (!userName.trim()) {
      setUserName('User');
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (pin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    }
    setPinError('');
    setStep(3);
  };

  const handleFinish = () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      setStep(2);
      setPinError('Please set and confirm your 4-digit PIN');
      return;
    }

    onComplete({
      baseCurrency: selectedCurrency,
      userName: userName.trim() || 'User',
      pin,
      enableBiometrics,
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-pearl-100 flex flex-col items-center justify-center p-4 sm:p-6 antialiased selection:bg-gold-500/30">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-gold-500/30 shadow-2xl relative">
        {/* Crown Accent */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-navy-800 via-navy-700 to-navy-600 border border-gold-500/40 flex items-center justify-center mb-5 shadow-gold mx-auto">
          <Crown className="w-7 h-7 text-gold-400" />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-gold-400 shadow-gold' : 'w-2.5 bg-navy-800 border border-white/10'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Profile & Currency */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">Create Your Vault</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Private, offline-first personal financial manager for you.
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
                placeholder="e.g. Shuhaib"
                className="w-full bg-navy-800/90 border border-white/10 rounded-xl px-4 py-3 text-sm text-pearl-100 focus:outline-none focus:border-gold-500 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gold-400" /> Choose Primary Currency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_CURRENCIES.slice(0, 6).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCurrency(c.code)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedCurrency === c.code
                        ? 'bg-gold-500/20 border-gold-500/60 text-gold-300 font-bold shadow-gold'
                        : 'bg-navy-800/60 border-white/10 text-pearl-300 hover:border-white/25'
                    }`}
                  >
                    <div className="text-base">{c.symbol}</div>
                    <div className="text-[10px] text-pearl-400">{c.code}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStep1Next}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all"
              >
                Set Security PIN <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Create Secret 4-Digit Password / PIN */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">Set Secret PIN</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Create a 4-digit PIN to lock and protect your private financial records.
              </p>
            </div>

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gold-400" /> Enter 4-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full bg-navy-800/90 border border-white/10 focus:border-gold-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-gold-300 focus:outline-none"
                placeholder="••••"
                autoFocus
              />
            </div>

            {/* Confirm PIN Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-pearl-300 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-gold-400" /> Confirm 4-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full bg-navy-800/90 border border-white/10 focus:border-gold-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-gold-300 focus:outline-none"
                placeholder="••••"
              />
            </div>

            {/* Validation Feedback */}
            {pinError && (
              <div className="p-2.5 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-xs text-crimson-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pin.length === 4 && confirmPin.length === 4 && pin === confirmPin && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>PIN matches! Ready to continue.</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-white/10 text-pearl-300 text-xs font-semibold hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStep2Next}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Security & Confirm Finish */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-pearl-50">Vault Ready</h2>
              <p className="text-xs text-pearl-300 mt-1">
                Your private space is configured. Review security options below.
              </p>
            </div>

            {/* Biometric Toggle Card */}
            <div className="p-4 rounded-2xl bg-navy-800/60 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-pearl-100">Fingerprint / Biometrics</span>
                  <p className="text-[11px] text-pearl-400">Unlock quickly using device biometrics</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
                className="w-5 h-5 accent-gold-500 rounded cursor-pointer"
              />
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-2xl bg-navy-900/80 border border-white/10 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-pearl-400">Vault Owner:</span>
                <span className="font-semibold text-pearl-100">{userName || 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl-400">Currency:</span>
                <span className="font-semibold text-gold-400">{selectedCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl-400">Security PIN:</span>
                <span className="font-semibold text-emerald-400">•••• (Configured)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pearl-400">Storage:</span>
                <span className="font-semibold text-pearl-200">100% Private Offline</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl border border-white/10 text-pearl-300 text-xs font-semibold hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Finish & Open App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
