import React from 'react';
import { Shield, Bell, Lock, Crown, WifiOff } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Account, SmartNotification, UserSettings } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onQuickAction: (action: 'add_expense' | 'add_income' | 'transfer' | 'voice_entry' | 'ask_ai') => void;
  accounts: Account[];
  notifications: SmartNotification[];
  userSettings: UserSettings | null;
  onLockApp: () => void;
  currencySymbol: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeScreen,
  onNavigate,
  onQuickAction,
  accounts,
  notifications,
  userSettings,
  onLockApp,
  currencySymbol,
}) => {
  // Calculate Net Worth: Assets - Liabilities
  const assets = accounts
    .filter((a) => a.type !== 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const liabilities = accounts
    .filter((a) => a.type === 'credit_card' && a.includeInNetWorth && !a.isArchived)
    .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

  const netWorth = assets - liabilities;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-navy-950 text-pearl-100 flex flex-col items-center justify-start antialiased selection:bg-gold-500/30">
      {/* Top Global Utility Bar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-emerald-900/10 sticky top-0 z-20 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 border border-emerald-400/40 flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform text-white">
              <Crown className="w-4 h-4 text-emerald-50" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-wide text-emerald-900">
                Finance Tracker
              </span>
            </div>
          </div>

          {/* Quick Net Worth Ticker */}
          <div
            onClick={() => onNavigate('reports')}
            className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 hover:border-emerald-400 cursor-pointer transition-all"
          >
            <span className="text-xs text-emerald-700 uppercase font-medium">Net Worth</span>
            <span className="font-display font-bold text-sm text-emerald-950">
              {currencySymbol}{netWorth.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Controls: Notifications, App Lock */}
          <div className="flex items-center gap-2">
            {/* Offline badge */}
            <div
              title="100% Offline Relational Storage (IndexedDB)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Offline First
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Lock Button */}
            <button
              onClick={onLockApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all text-xs font-semibold"
              title="Lock App"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-100" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Natural Responsive (Desktop on desktop, Mobile on mobile) */}
      <main className="w-full flex-1 flex justify-center p-0 sm:py-6 sm:px-4">
        <div className="w-full max-w-6xl pb-28 px-4 sm:px-6">
          {children}
          <BottomNav
            activeScreen={activeScreen}
            onNavigate={onNavigate}
            onQuickAction={onQuickAction}
          />
        </div>
      </main>
    </div>
  );
};
