import Link from 'next/link';
import { Lock } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { VELS } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="bg-black border-t border-[hsl(43_30%_25%)] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <CoinLogo size={48} />
          <div>
            <h3 className="font-serif text-xl gold-text font-bold">SHANMUGAVEL'S BOOKSTORE</h3>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">
              {VELS.founder.tagline}
            </p>
          </div>
          <FairyQuote size="sm" className="max-w-2xl" />
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]">
              Home
            </Link>
            <Link href="/#ebooks" className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]">
              eBooks
            </Link>
            <Link href="/#audiobooks" className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]">
              Audiobooks
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]">
              About Founder
            </Link>
            <Link href="/cart" className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]">
              Cart
            </Link>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            &copy; {new Date().getFullYear()} {VELS.founder.publisher}. Founded by {VELS.founder.name}.
          </div>
          <Link
            href="/founder-vault"
            className="text-muted-foreground/40 hover:text-[hsl(43_65%_52%)] transition-colors mt-2"
            aria-label="Founder Vault"
          >
            <Lock className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
