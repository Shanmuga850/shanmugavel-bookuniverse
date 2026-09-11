'use client';

import { cn } from '@/lib/utils';

interface CoinLogoProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

export function CoinLogo({ size = 40, className, spinning = false }: CoinLogoProps) {
  const hasWidthClass = /\bw-\d/.test(className || '');

  return (
    <img
      src="/logo.png"
      alt="Shanmugavel M - BookUniverse"
      className={cn(
        'inline-flex rounded-full object-contain',
        spinning && 'animate-[coin-spin_4s_linear_infinite]',
        className,
      )}
      style={hasWidthClass ? undefined : { width: size, height: size }}
    />
  );
}
