import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'crimson' | 'navy' | 'pearl' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'navy',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    gold: 'bg-gold-500/15 text-gold-300 border border-gold-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    crimson: 'bg-crimson-500/15 text-crimson-400 border border-crimson-500/30',
    navy: 'bg-navy-700/50 text-pearl-200 border border-navy-600/50',
    pearl: 'bg-pearl-100/10 text-pearl-100 border border-pearl-200/20',
    blue: 'bg-navy-500/20 text-blue-300 border border-navy-500/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-sm px-3 py-1 rounded-full font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
