'use client';

import { cn } from '@/lib/utils';

interface CoinLogoProps {
  size?: number;
  className?: string;
  spinning?: boolean;
}

export function CoinLogo({ size = 40, className, spinning = false }: CoinLogoProps) {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          'rounded-full gold-gradient flex items-center justify-center',
          spinning && 'animate-[coin-spin_4s_linear_infinite]'
        )}
        style={{
          width: size,
          height: size,
          boxShadow: '0 0 12px rgba(212,175,55,0.4), inset 0 0 8px rgba(0,0,0,0.3)',
          border: '2px solid hsl(40 55% 35%)',
        }}
      >
        <span
          className="font-bold text-black"
          style={{
            fontSize: size * 0.4,
            fontFamily: 'serif',
            textShadow: '0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          V
        </span>
      </div>
    </div>
  );
}
