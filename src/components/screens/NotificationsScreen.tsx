import React from 'react';
import { SmartNotification } from '../../types';
import { Bell, CheckCircle, AlertTriangle, Sparkles, Trash2, Check, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

interface NotificationsScreenProps {
  notifications: SmartNotification[];
  onMarkAllRead: () => Promise<void>;
  onClearNotification: (id: string) => Promise<void>;
  onNavigate: (screen: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onMarkAllRead,
  onClearNotification,
  onNavigate,
}) => {
  const getIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-crimson-400" />;
      case 'insight':
        return <Sparkles className="w-4 h-4 text-gold-400" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-pearl-50">Notifications</h2>
          <p className="text-xs text-pearl-400">Alerts, bill reminders, and updates</p>
        </div>
        <button
          onClick={onMarkAllRead}
          className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pearl-200 transition-colors"
        >
          Mark All Read
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-pearl-400">
            <p className="text-xs">No active alerts or reminders.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card rounded-2xl p-4 border transition-all flex items-start justify-between gap-3 ${
                n.isRead ? 'border-white/5 opacity-70' : 'border-gold-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pearl-100 text-sm">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-pearl-300 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-pearl-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {n.actionScreen && (
                  <button
                    onClick={() => onNavigate(n.actionScreen!)}
                    className="text-xs text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onClearNotification(n.id)}
                  className="p-1 rounded text-pearl-400 hover:text-crimson-400 transition-colors"
                  title="Dismiss"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
