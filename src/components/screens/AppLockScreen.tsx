import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, Shield, Crown } from 'lucide-react';

interface AppLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  userName?: string;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  correctPin = '0000',
  onUnlock,
  userName = 'User',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometric = () => {
    // Simulated biometric unlock
    onUnlock();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, correctPin]);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 flex flex-col items-center justify-between p-8">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-gold-500/40 flex items-center justify-center mb-3 shadow-gold">
          <Crown className="w-7 h-7 text-gold-400" />
        </div>
        <h2 className="text-xl font-bold font-display text-pearl-50 tracking-wide">Finance Tracker</h2>
        <p className="text-xs text-pearl-400 mt-1">Welcome back, {userName}</p>
      </div>

      {/* Center PIN Indicator */}
      <div className="flex flex-col items-center my-auto">
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-wider text-pearl-400 uppercase">
          <Lock className="w-3.5 h-3.5 text-gold-400" /> Enter PIN
        </div>

        {/* 4 dots */}
        <div className={`flex items-center gap-4 transition-transform ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-gold-400 scale-110 shadow-gold'
                    : 'bg-navy-800 border border-white/20'
                } ${error ? 'border-crimson-500 bg-crimson-500/40' : ''}`}
              />
            );
          })}
        </div>
        {error && <span className="text-xs text-crimson-400 mt-3 font-medium">Incorrect PIN</span>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="w-16 h-16 mx-auto rounded-full bg-navy-900/80 hover:bg-white/10 active:bg-gold-500/20 border border-white/10 text-xl font-medium text-pearl-100 flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            onClick={handleBiometric}
            className="w-16 h-16 mx-auto rounded-full bg-navy-900/40 hover:bg-white/10 border border-white/10 text-gold-400 flex items-center justify-center transition-all active:scale-95"
            title="Biometric Unlock"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 mx-auto rounded-full bg-navy-900/80 hover:bg-white/10 active:bg-gold-500/20 border border-white/10 text-xl font-medium text-pearl-100 flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            className="w-16 h-16 mx-auto rounded-full bg-navy-900/40 hover:bg-white/10 border border-white/10 text-pearl-300 flex items-center justify-center transition-all active:scale-95"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
