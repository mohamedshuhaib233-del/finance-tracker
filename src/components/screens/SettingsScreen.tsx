import React, { useState } from 'react';
import { UserSettings, CurrencyCode } from '../../types';
import { Shield, Lock, Globe, RotateCcw, Trash2, Check, Smartphone, Crown, Moon } from 'lucide-react';
import { Badge } from '../common/Badge';

interface SettingsScreenProps {
  userSettings: UserSettings | null;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onResetNumbersToZero: () => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onNavigateCurrency: () => void;
  onLockApp: () => void;
  onSwitchUser: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userSettings,
  onUpdateSettings,
  onResetNumbersToZero,
  onResetDemoData,
  onNavigateCurrency,
  onLockApp,
  onSwitchUser,
}) => {
  const [userName, setUserName] = useState(userSettings?.userName || 'User');
  const [pin, setPin] = useState(userSettings?.pinCode || '');
  const [appLockEnabled, setAppLockEnabled] = useState(userSettings?.isAppLocked ?? true);
  const [requirePin, setRequirePin] = useState(userSettings?.requirePinOnResume ?? true);
  const [monthsTarget, setMonthsTarget] = useState(userSettings?.emergencyFundMonthsTarget || 6);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      userName,
      pinCode: pin || '0000',
      isAppLocked: appLockEnabled,
      requirePinOnResume: requirePin,
      emergencyFundMonthsTarget: monthsTarget,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-pearl-50">Settings</h2>
        <p className="text-xs text-pearl-400">Profile, security, and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-pearl-400 block">
            Profile
          </span>
          <div>
            <label className="block text-xs font-medium text-pearl-300 mb-1">Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Currency & Internationalization */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pearl-400 block">
                Primary Currency
              </span>
              <span className="text-sm font-semibold text-pearl-100">
                {userSettings?.baseCurrency || 'INR'} (₹ Indian Rupee)
              </span>
            </div>
            <button
              type="button"
              onClick={onNavigateCurrency}
              className="px-3 py-1.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> Manage Currencies
            </button>
          </div>
        </div>

        {/* Security & PIN Lock System */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 block">
              Lock System & PIN Security
            </span>
            <Badge variant="gold" size="sm">PIN Protected</Badge>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-pearl-200 block">Enable PIN Lock</span>
              <span className="text-[11px] text-pearl-400">Require PIN when opening the app</span>
            </div>
            <input
              type="checkbox"
              checked={appLockEnabled}
              onChange={(e) => setAppLockEnabled(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-pearl-300 mb-1">4-Digit Passcode / PIN</label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-32 bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-gold-400 focus:outline-none focus:border-gold-500"
                placeholder="••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-pearl-200 block">Auto-Lock When Resuming</span>
              <span className="text-[11px] text-pearl-400">Lock app when switching tabs or backgrounded</span>
            </div>
            <input
              type="checkbox"
              checked={requirePin}
              onChange={(e) => setRequirePin(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLockApp}
              className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-pearl-200 hover:text-gold-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-gold-400" /> Lock App Now
            </button>
          </div>
        </div>

        {/* Emergency Fund Target Months */}
        <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-pearl-400">
              Emergency Fund Target
            </span>
            <span className="text-sm font-bold font-display text-gold-400">{monthsTarget} Months</span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            value={monthsTarget}
            onChange={(e) => setMonthsTarget(parseInt(e.target.value))}
            className="w-full h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-gold-400"
          />
          <p className="text-[11px] text-pearl-400">
            Target reserve: {monthsTarget} months of living expenses.
          </p>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-gold transition-all"
        >
          {savedMessage ? <Check className="w-4 h-4 stroke-[3]" /> : null}
          {savedMessage ? 'Settings Saved Successfully!' : 'Save Preferences'}
        </button>
      </form>

      {/* Multi-User & Vault Setup */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-pearl-400 block">
          Vault & User Setup
        </span>
        <p className="text-xs text-pearl-300">
          Active Vault: <strong className="text-gold-300">{userSettings?.userName || 'User'}</strong>
        </p>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Do you want to set up a new vault or switch profile? This will launch the setup wizard.')) {
              onSwitchUser();
            }
          }}
          className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/30 text-gold-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Set Up New Vault / Switch Account
        </button>
      </div>

      {/* Database Operations */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-pearl-400 block">
          Reset Numbers & Data
        </span>

        {/* Reset All Numbers to 0 Button */}
        <button
          type="button"
          onClick={async () => {
            if (window.confirm('Reset all numbers in the app? All account balances, transactions, and budgets will be reset to ₹0.')) {
              await onResetNumbersToZero();
              alert('All numbers and balances have been reset to 0!');
            }
          }}
          className="w-full py-2.5 rounded-xl bg-crimson-500/15 hover:bg-crimson-500/25 border border-crimson-500/30 text-crimson-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Numbers to 0 (Fresh Start)
        </button>

        {/* Restore Sample Demo Data Button */}
        <button
          type="button"
          onClick={async () => {
            if (window.confirm('Load sample demo data with mock accounts and transactions?')) {
              await onResetDemoData();
              alert('Sample demo data restored.');
            }
          }}
          className="w-full py-2 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-pearl-400 hover:text-pearl-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Load Sample Demo Data (Testing)
        </button>
      </div>
    </div>
  );
};
