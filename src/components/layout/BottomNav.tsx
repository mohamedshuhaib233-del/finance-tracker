import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Bot,
  PieChart,
  Menu,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Mic,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

interface BottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onQuickAction: (action: 'add_expense' | 'add_income' | 'transfer' | 'voice_entry' | 'ask_ai') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onNavigate,
  onQuickAction,
}) => {
  const [isFabOpen, setIsFabOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Activity', icon: ReceiptText },
    { id: 'fab', label: '', icon: Plus, isFab: true },
    { id: 'ai_coach', label: 'AI Coach', icon: Bot },
    { id: 'more', label: 'Hub', icon: Menu },
  ];

  return (
    <>
      {/* Quick Action Overlay Sheet when FAB is pressed */}
      {isFabOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-md flex flex-col justify-end p-4 pb-24 animate-fadeIn"
          onClick={() => setIsFabOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-auto glass-card rounded-3xl p-5 border border-gold-500/30 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pb-2 border-b border-white/10">
              <span className="text-xs uppercase font-semibold tracking-wider text-gold-400">Quick Actions</span>
              <p className="text-sm text-pearl-200">What would you like to record?</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onQuickAction('add_expense');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/30 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-crimson-500/20 text-crimson-400 group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-pearl-100 text-sm">Add Expense</div>
                  <div className="text-[11px] text-pearl-400">Track spending</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onQuickAction('add_income');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-pearl-100 text-sm">Add Income</div>
                  <div className="text-[11px] text-pearl-400">Log earnings</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setIsFabOpen(false);
                onQuickAction('voice_entry');
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-navy-800 via-navy-750 to-navy-800 hover:border-gold-500/50 border border-gold-500/30 text-left transition-all group shadow-gold"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gold-500/20 text-gold-400 group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="font-bold text-gold-300 text-sm flex items-center gap-1.5">
                    Voice Expense Entry <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <div className="text-[11px] text-pearl-300">"Spent 250 for lunch via cash"</div>
                </div>
              </div>
              <span className="text-xs text-gold-400 font-semibold px-2 py-1 rounded-full bg-gold-500/10 border border-gold-500/20">AI Parse</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onQuickAction('transfer');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <div className="p-2 rounded-xl bg-white/10 text-pearl-200">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-pearl-100 text-sm">Transfer</div>
                  <div className="text-[11px] text-pearl-400">Self accounts</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsFabOpen(false);
                  onQuickAction('ask_ai');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <div className="p-2 rounded-xl bg-white/10 text-gold-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-pearl-100 text-sm">Ask AI Coach</div>
                  <div className="text-[11px] text-pearl-400">Recommendations</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-3 px-4">
        <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border border-emerald-200/60 rounded-3xl shadow-lg py-2 px-3 flex items-center justify-around">
          {navItems.map((item) => {
            if (item.isFab) {
              return (
                <div key="fab" className="relative -top-5">
                  <button
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={clsx(
                      'w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white p-3.5 shadow-gold hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-[#F8FAF8]',
                      isFabOpen && 'rotate-45'
                    )}
                    aria-label="Quick Action"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={clsx(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative',
                  isActive ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-emerald-800'
                )}
              >
                <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'scale-110 text-emerald-600')} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute -bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
