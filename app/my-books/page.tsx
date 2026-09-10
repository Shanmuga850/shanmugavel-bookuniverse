'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Headphones, ArrowLeft, Shield } from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

interface Purchase {
  id: string;
  type: 'ebook' | 'audiobook';
  title: string;
  date: string;
}

interface PurchasedBook {
  id: string;
  title: string;
  cover_url: string | null;
  type: 'ebook' | 'audiobook';
}

export default function MyBooksPage() {
  const [purchases, setPurchases] = useState<PurchasedBook[]>([]);

  useEffect(() => {
    async function loadPurchases() {
      try {
        const raw: Purchase[] = JSON.parse(localStorage.getItem('vels_purchases') || '[]');
        const ebookIds = raw.filter((p) => p.type === 'ebook').map((p) => p.id);
        const audioIds = raw.filter((p) => p.type === 'audiobook').map((p) => p.id);

        const books: PurchasedBook[] = [];

        if (ebookIds.length > 0) {
          const { data } = await supabase
            .from('ebooks')
            .select('id, title, cover_url')
            .in('id', ebookIds);
          (data || []).forEach((b) => books.push({ ...b, type: 'ebook' }));
        }

        if (audioIds.length > 0) {
          const { data } = await supabase
            .from('audiobooks')
            .select('id, title, cover_url')
            .in('id', audioIds);
          (data || []).forEach((b) => books.push({ ...b, type: 'audiobook' }));
        }

        setPurchases(books);
      } catch {
        setPurchases([]);
      }
    }
    loadPurchases();
  }, []);

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-6 w-6 text-[hsl(43_65%_52%)]" />
          <h1 className="font-serif text-3xl font-bold gold-text">My Books</h1>
        </div>

        {purchases.length === 0 ? (
          <div className="black-gold-card p-12 text-center">
            <CoinLogo size={48} className="mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You have not purchased any books yet.
            </p>
            <Link href="/">
              <Button className="gold-gradient text-black font-semibold hover:glow-gold">
                Browse Books
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((book) => (
              <div key={`${book.type}-${book.id}`} className="black-gold-card overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-28 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex-shrink-0">
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {book.type === 'ebook' ? (
                          <BookOpen className="h-6 w-6 text-[hsl(43_65%_52%)]" />
                        ) : (
                          <Headphones className="h-6 w-6 text-[hsl(43_65%_52%)]" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold line-clamp-2">{book.title}</h3>
                      <span className="inline-flex items-center gap-1 text-xs text-[hsl(43_65%_52%)] mt-1">
                        {book.type === 'ebook' ? <BookOpen className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
                        {book.type === 'ebook' ? 'eBook' : 'Audiobook'}
                      </span>
                    </div>
                    <Link href={`/${book.type === 'ebook' ? 'books' : 'audiobooks'}/${book.id}`}>
                      <Button
                        size="sm"
                        className="w-full gold-gradient text-black font-semibold hover:glow-gold mt-2"
                      >
                        {book.type === 'ebook' ? 'Read Now' : 'Play Now'}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    READ / PLAY ONLY — No Download
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
