import React, { useEffect, useState } from 'react';
import { Crown, Shield, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFade(true), 1600);
    const timer2 = setTimeout(() => onComplete(), 2000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-navy-950 flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Radial Gold Background Flare */}
      <div className="absolute w-96 h-96 rounded-full bg-navy-800/60 filter blur-3xl -z-10" />
      <div className="absolute w-64 h-64 rounded-full bg-gold-500/10 filter blur-2xl -z-10" />

      {/* Luxury Crest Badge */}
      <div className="relative mb-6 animate-bounce">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-navy-800 via-navy-700 to-navy-600 border-2 border-gold-500/60 flex items-center justify-center shadow-gold">
          <Crown className="w-12 h-12 text-gold-400" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-6 h-6 text-gold-300 animate-spin" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-pearl-50 mb-1">
        Finance Tracker
      </h1>
      <p className="text-xs tracking-wider text-gold-400 font-semibold mb-6">
        Smart Financial Management
      </p>

      {/* Micro Status */}
      <div className="flex items-center gap-2 text-xs text-pearl-400 bg-navy-900/80 px-4 py-1.5 rounded-full border border-white/10">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>Private & Offline</span>
      </div>

      <div className="mt-8 w-36 h-1 bg-navy-800 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-gold-500 to-gold-300 animate-pulse" />
      </div>
    </div>
  );
};
