import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
  ShieldCheck,
  Lock,
  Camera,
  User,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  KeyRound,
  MessageSquare,
  Send,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { UserSettings } from '../../types';
import { SmsReminderModal } from './SmsReminderModal';
import { SmsService } from '../../services/smsService';
import { getActiveVaultId } from '../../db/database';

interface MoreHubScreenProps {
  userSettings: UserSettings | null;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onNavigate: (screen: string) => void;
  onLockApp: () => void;
  currencySymbol?: string;
}

export const MoreHubScreen: React.FC<MoreHubScreenProps> = ({
  userSettings,
  onUpdateSettings,
  onNavigate,
  onLockApp,
  currencySymbol = '₹',
}) => {
  const [userName, setUserName] = useState(userSettings?.userName || 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick summary of pending dues
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);

  useEffect(() => {
    if (userSettings?.userName) {
      setUserName(userSettings.userName);
    }
  }, [userSettings?.userName]);

  useEffect(() => {
    const list = SmsService.getReminders(getActiveVaultId());
    setPendingRemindersCount(list.filter((r) => r.status === 'pending').length);
  }, [isSmsModalOpen]);

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    setIsSavingName(true);
    await onUpdateSettings({ userName: userName.trim() });
    setIsSavingName(false);
    setIsEditingName(false);
    setNameSavedSuccess(true);
    setTimeout(() => setNameSavedSuccess(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateSettings({ avatarUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    await onUpdateSettings({ avatarUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hubModules = [
    {
      group: 'Money Tracking & SMS Reminders',
      items: [
        { id: 'sms_reminders', label: 'SMS Payment Reminders', desc: 'Send SMS for money to receive or pay', icon: MessageSquare, color: 'text-emerald-700 bg-emerald-50' },
        { id: 'accounts', label: 'Accounts', desc: 'Bank, cash, credit card & UPI wallets', icon: Building2, color: 'text-blue-700 bg-blue-50' },
        { id: 'budgets', label: 'Budgets', desc: 'Monthly spending limits', icon: PieChart, color: 'text-amber-700 bg-amber-50' },
        { id: 'goals', label: 'Savings Goals', desc: 'Target savings tracking', icon: Target, color: 'text-teal-700 bg-teal-50' },
        { id: 'reports', label: 'Reports & Analytics', desc: 'Cash flow, spending trends & net worth', icon: BarChart3, color: 'text-purple-700 bg-purple-50' },
      ],
    },
    {
      group: 'AI & Insights',
      items: [
        { id: 'ai_coach', label: 'AI Money Coach', desc: 'Recommendations & financial forecasts', icon: Bot, color: 'text-emerald-700 bg-emerald-50' },
        { id: 'health', label: 'Financial Health', desc: '9 measurable indicators', icon: Activity, color: 'text-blue-700 bg-blue-50' },
      ],
    },
    {
      group: 'Bills & Subscriptions',
      items: [
        { id: 'bills', label: 'Bill Reminders', desc: 'Upcoming due dates & clearing alerts', icon: Calendar, color: 'text-rose-700 bg-rose-50' },
        { id: 'recurring', label: 'Recurring Rules', desc: 'Salary, rent & EMIs', icon: Repeat, color: 'text-indigo-700 bg-indigo-50' },
        { id: 'subscriptions', label: 'Subscription Tracker', desc: 'Active digital services', icon: Tv, color: 'text-cyan-700 bg-cyan-50' },
      ],
    },
    {
      group: 'Settings & Storage',
      items: [
        { id: 'notifications', label: 'Notifications', desc: 'Alerts & bill reminders', icon: Bell, color: 'text-amber-700 bg-amber-50' },
        { id: 'currency', label: 'Currency', desc: 'Multi-currency rates & base currency', icon: Globe, color: 'text-emerald-700 bg-emerald-50' },
        { id: 'backup_sync', label: 'Backup & Sync', desc: 'Offline storage & data export', icon: HardDrive, color: 'text-blue-700 bg-blue-50' },
        { id: 'settings', label: 'Security & PIN Settings', desc: 'Vault passcode & preferences', icon: Settings, color: 'text-slate-700 bg-slate-100' },
      ],
    },
  ];

  const currentInitial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Hidden File Input for Gallery Image Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* TOP: Rich Profile Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
        {/* Subtle decorative ambient backdrop */}
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-emerald-100/40 filter blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Camera badge */}
          <div className="relative shrink-0 group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-400/50 shadow-md flex items-center justify-center bg-gradient-to-tr from-emerald-700 to-teal-500 text-white">
              {userSettings?.avatarUrl ? (
                <img
                  src={userSettings.avatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold font-display">{currentInitial}</span>
              )}
            </div>

            {/* Quick Camera Upload Trigger on Avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-white transition-all transform active:scale-95"
              title="Upload photo from gallery"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Details & Name Editing */}
          <div className="flex-1 text-center sm:text-left space-y-2.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Private Vault Profile
              </span>
              {nameSavedSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" /> Name Updated!
                </span>
              )}
            </div>

            {/* Name Display & Editable Input */}
            {isEditingName ? (
              <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-base font-bold text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserName(userSettings?.userName || 'User');
                    setIsEditingName(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                  {userName}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  title="Edit Name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Row: Gallery photo upload & photo removal */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload from Gallery</span>
              </button>

              {userSettings?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Remove Profile Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE SMS SECTION: Direct SMS Payment Reminders Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-5 sm:p-6 border border-emerald-600/30 shadow-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full filter blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display text-white">
                SMS Payment Reminders
              </h3>
              {pendingRemindersCount > 0 && (
                <span className="text-[11px] bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold">
                  {pendingRemindersCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
              ആർക്കെങ്കിലും പണം നൽകാനുണ്ടെങ്കിലോ ആരെങ്കിലും പണം തരാനുണ്ടെങ്കിലോ ഫോൺ നമ്പർ നൽകി നേരിട്ട് സാധാരണ SMS അയക്കുക.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSmsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm hover:bg-emerald-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4 text-emerald-700" />
            <span>SMS അയക്കുക / കണക്കുകൾ</span>
          </button>
        </div>
      </div>

      {/* Module Groups (Hub & Tools) */}
      <div className="space-y-4">
        {hubModules.map((grp) => (
          <div key={grp.group} className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              {grp.group}
            </span>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {grp.items.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'sms_reminders') {
                        setIsSmsModalOpen(true);
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
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
          className="w-full py-3 rounded-2xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Lock className="w-4 h-4 text-red-500" /> Lock Vault Now
        </button>
      </div>

      {/* Dedicated SMS Reminder Modal */}
      <SmsReminderModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        senderName={userName}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
