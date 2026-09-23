import React from 'react';
import {
  Building2,
  PieChart,
  Target,
  Bot,
  Activity,
  BarChart3,
  Calendar,
  Repeat,
  Tv,
  Bell,
  Globe,
  HardDrive,
  Settings,
  Download,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface MoreHubScreenProps {
  onNavigate: (screen: string) => void;
  onLockApp: () => void;
}

export const MoreHubScreen: React.FC<MoreHubScreenProps> = ({ onNavigate, onLockApp }) => {
  const hubModules = [
    {
      group: 'Money Tracking',
      items: [
        { id: 'accounts', label: 'Accounts', desc: 'Bank, cash, credit card & UPI wallets', icon: Building2, color: 'text-blue-400' },
        { id: 'budgets', label: 'Budgets', desc: 'Monthly spending limits', icon: PieChart, color: 'text-amber-400' },
        { id: 'goals', label: 'Savings Goals', desc: 'Target savings tracking', icon: Target, color: 'text-emerald-400' },
        { id: 'reports', label: 'Reports & Analytics', desc: 'Cash flow, spending trends & net worth', icon: BarChart3, color: 'text-purple-400' },
      ],
    },
    {
      group: 'AI & Insights',
      items: [
        { id: 'ai_coach', label: 'AI Money Coach', desc: 'Recommendations & financial forecasts', icon: Bot, color: 'text-gold-400' },
        { id: 'health', label: 'Financial Health', desc: '9 measurable indicators', icon: Activity, color: 'text-teal-400' },
      ],
    },
    {
      group: 'Bills & Subscriptions',
      items: [
        { id: 'bills', label: 'Bill Reminders', desc: 'Upcoming due dates & clearing alerts', icon: Calendar, color: 'text-rose-400' },
        { id: 'recurring', label: 'Recurring Rules', desc: 'Salary, rent & EMIs', icon: Repeat, color: 'text-indigo-400' },
        { id: 'subscriptions', label: 'Subscription Tracker', desc: 'Active digital services', icon: Tv, color: 'text-cyan-400' },
      ],
    },
    {
      group: 'Settings & Storage',
      items: [
        { id: 'notifications', label: 'Notifications', desc: 'Alerts & bill reminders', icon: Bell, color: 'text-amber-400' },
        { id: 'currency', label: 'Currency', desc: 'Multi-currency rates & base currency', icon: Globe, color: 'text-emerald-400' },
        { id: 'backup_sync', label: 'Backup & Sync', desc: 'Offline storage & data export', icon: HardDrive, color: 'text-blue-400' },
        { id: 'settings', label: 'Settings', desc: 'PIN security & profile', icon: Settings, color: 'text-pearl-300' },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-pearl-50">Menu</h2>
        <p className="text-xs text-pearl-400">All features, tools, and settings</p>
      </div>

      {/* Module Groups */}
      <div className="space-y-4">
        {hubModules.map((grp) => (
          <div key={grp.group} className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 px-1">
              {grp.group}
            </span>

            <div className="glass-card rounded-2xl divide-y divide-white/10 overflow-hidden">
              {grp.items.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-pearl-100 text-xs sm:text-sm">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-pearl-400">{item.desc}</div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-pearl-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lock App Quick Trigger */}
      <div className="pt-2">
        <button
          onClick={onLockApp}
          className="w-full py-3 rounded-2xl bg-navy-900 border border-white/10 hover:border-crimson-500/30 text-pearl-300 hover:text-crimson-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Lock className="w-4 h-4" /> Lock App
        </button>
      </div>
    </div>
  );
};
