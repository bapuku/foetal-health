'use client';

import { type ReactNode } from 'react';

export type BadgeVariant = 'ok' | 'warn' | 'danger' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  ok: 'badge-ok',
  warn: 'badge-warn',
  danger: 'badge-danger',
  info: 'badge-info',
};

interface BadgeActionProps {
  children: ReactNode;
  variant?: BadgeVariant;
  onClick?: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
}

export default function BadgeAction({
  children,
  variant = 'info',
  onClick,
  className = '',
  title,
  disabled = false,
}: BadgeActionProps) {
  const baseClass = variantClasses[variant];
  const isClickable = Boolean(onClick && !disabled);

  return (
    <span
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      title={title}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`${baseClass} ${isClickable ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
