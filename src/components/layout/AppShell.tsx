import React from 'react';
import { Shield, Bell, Lock, Crown, WifiOff } from 'lucide-react';
import { DeviceFrameToggle } from './DeviceFrameToggle';
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
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
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
  isMobileFrame,
  setIsMobileFrame,
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
      <header className="w-full bg-navy-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-navy-800 via-navy-700 to-navy-600 border border-gold-500/40 flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
              <Crown className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-wide text-pearl-50">
                Finance Tracker
              </span>
            </div>
          </div>

          {/* Quick Net Worth Ticker */}
          <div
            onClick={() => onNavigate('reports')}
            className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-navy-800/80 border border-white/10 hover:border-gold-500/30 cursor-pointer transition-all"
          >
            <span className="text-xs text-pearl-400 uppercase font-medium">Net Worth</span>
            <span className="font-display font-bold text-sm text-pearl-50">
              {currencySymbol}{netWorth.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Controls: Device Frame Toggle, Notifications, App Lock */}
          <div className="flex items-center gap-2">
            <DeviceFrameToggle isMobileFrame={isMobileFrame} onToggle={setIsMobileFrame} />

            {/* Offline badge */}
            <div
              title="100% Offline Relational Storage (IndexedDB)"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Offline First
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-2 rounded-xl bg-navy-800/80 hover:bg-white/10 border border-white/10 text-pearl-300 hover:text-pearl-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-navy-950 font-bold text-[10px] flex items-center justify-center ring-2 ring-navy-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Lock Button */}
            <button
              onClick={onLockApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-navy-800/80 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-pearl-200 hover:text-gold-300 transition-colors text-xs font-semibold"
              title="Lock App"
            >
              <Lock className="w-3.5 h-3.5 text-gold-400" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex justify-center p-0 sm:py-6 sm:px-4">
        {isMobileFrame ? (
          /* Simulated iPhone / Android Native Device Frame */
          <div className="w-full max-w-[430px] my-auto bg-navy-950 rounded-[48px] border-[10px] border-navy-850 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col relative h-[844px]">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-navy-900 border border-white/20" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>

            {/* Mobile Viewport Screen */}
            <div className="flex-1 overflow-y-auto pt-7 pb-20 px-4 relative">
              {children}
            </div>

            {/* Bottom Nav inside phone frame */}
            <BottomNav
              activeScreen={activeScreen}
              onNavigate={onNavigate}
              onQuickAction={onQuickAction}
            />
          </div>
        ) : (
          /* Desktop / Full Responsive Viewport */
          <div className="w-full max-w-6xl pb-28 px-4 sm:px-6">
            {children}
            <BottomNav
              activeScreen={activeScreen}
              onNavigate={onNavigate}
              onQuickAction={onQuickAction}
            />
          </div>
        )}
      </main>
    </div>
  );
};
