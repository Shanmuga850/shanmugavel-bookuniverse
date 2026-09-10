import { cn } from '@/lib/utils';
import { VELS } from '@/lib/constants';

interface FairyQuoteProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FairyQuote({ className, size = 'md' }: FairyQuoteProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg md:text-xl',
  };
  return (
    <blockquote
      className={cn(
        'fairy-quote font-serif italic text-center leading-relaxed',
        sizes[size],
        className
      )}
    >
      &ldquo;{VELS.fairyQuote}&rdquo;
    </blockquote>
  );
}
