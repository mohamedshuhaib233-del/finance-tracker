import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { clsx } from 'clsx';

interface DeviceFrameToggleProps {
  isMobileFrame: boolean;
  onToggle: (enabled: boolean) => void;
}

export const DeviceFrameToggle: React.FC<DeviceFrameToggleProps> = ({ isMobileFrame, onToggle }) => {
  return (
    <div className="flex items-center gap-1 bg-navy-900/90 p-1 rounded-xl border border-white/10 shadow-lg text-xs">
      <button
        onClick={() => onToggle(true)}
        className={clsx(
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all',
          isMobileFrame
            ? 'bg-gold-500/20 text-gold-300 font-semibold border border-gold-500/30'
            : 'text-pearl-400 hover:text-pearl-200'
        )}
        title="Mobile Device Frame View"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mobile</span>
      </button>

      <button
        onClick={() => onToggle(false)}
        className={clsx(
          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all',
          !isMobileFrame
            ? 'bg-gold-500/20 text-gold-300 font-semibold border border-gold-500/30'
            : 'text-pearl-400 hover:text-pearl-200'
        )}
        title="Full Screen / Responsive Desktop View"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Desktop</span>
      </button>
    </div>
  );
};
