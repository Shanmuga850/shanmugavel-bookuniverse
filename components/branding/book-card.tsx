'use client';

import Link from 'next/link';
import { BookOpen, Headphones, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  mrp: number;
  authors: string[];
  type: 'ebook' | 'audiobook';
  sku?: string;
}

export function BookCard({ id, title, subtitle, coverUrl, mrp, authors, type, sku }: BookCardProps) {
  const href = type === 'ebook' ? `/books/${id}` : `/audiobooks/${id}`;
  const Icon = type === 'ebook' ? BookOpen : Headphones;

  return (
    <Link href={href} className="group block">
      <div className="black-gold-card overflow-hidden transition-all duration-300 hover:glow-gold-strong hover:-translate-y-1">
        {/* Cover area - 3:4 aspect ratio for book cover */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-[hsl(0_0%_10%)] to-[hsl(0_0%_5%)] flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Icon className="h-12 w-12 text-[hsl(43_65%_52%)]" />
              <span className="text-xs uppercase tracking-wider">No Cover</span>
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-sm text-[hsl(43_65%_52%)] text-[10px] font-medium px-2 py-1 rounded-full border border-[hsl(43_30%_25%)]">
              <Icon className="h-3 w-3" />
              {type === 'ebook' ? 'eBook' : 'Audio'}
            </span>
          </div>
          {/* First page badge for ebooks */}
          {type === 'ebook' && coverUrl && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-[hsl(43_65%_52%)] text-black text-[10px] font-bold px-2 py-1 rounded">
                Cover = First Page
              </span>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="p-4 space-y-2">
          <h3 className="font-serif text-base font-bold text-foreground line-clamp-2 group-hover:text-[hsl(43_65%_52%)] transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
          <p className="text-xs text-muted-foreground">
            by {authors.join(', ')}
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-bold gold-text flex items-center">
              <IndianRupee className="h-4 w-4" />
              {mrp}
            </span>
            {sku && (
              <span className="text-[10px] text-muted-foreground font-mono">{sku}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
