'use client';

import { cn } from '@/lib/utils';

interface CoinLogoProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

export function CoinLogo({ size = 40, className, spinning = false }: CoinLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Shanmugavel M - BookUniverse"
      className={cn(
        'inline-flex rounded-full object-contain',
        spinning && 'animate-[coin-spin_4s_linear_infinite]',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
