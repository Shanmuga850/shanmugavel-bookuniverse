'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Headphones, Library, ArrowRight, Lock } from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

interface LibraryItem {
  id: string;
  type: 'ebook' | 'audiobook';
  title: string;
  cover_url: string | null;
  mrp: number;
  authors: string[];
}

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.push('/auth');
        return;
      }
      setAuthed(true);

      const userId = session.session.user.id;
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          ebook_id,
          audiobook_id,
          ebooks (
            id,
            title,
            cover_url,
            mrp,
            authors
          ),
          audiobooks (
            id,
            title,
            cover_url,
            mrp,
            authors
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Library load error:', error);
        setItems([]);
      } else if (data) {
        const mapped: LibraryItem[] = [];
        data.forEach((p) => {
          const ebook = Array.isArray(p.ebooks) ? p.ebooks[0] : p.ebooks;
          if (ebook) {
            mapped.push({
              id: ebook.id,
              type: 'ebook',
              title: ebook.title,
              cover_url: ebook.cover_url,
              mrp: ebook.mrp,
              authors: ebook.authors || ['Shanmugavel M'],
            });
          }
          const audiobook = Array.isArray(p.audiobooks) ? p.audiobooks[0] : p.audiobooks;
          if (audiobook) {
            mapped.push({
              id: audiobook.id,
              type: 'audiobook',
              title: audiobook.title,
              cover_url: audiobook.cover_url,
              mrp: audiobook.mrp,
              authors: audiobook.authors || ['Shanmugavel M'],
            });
          }
        });
        setItems(mapped);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen vels-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <CoinLogo size={48} spinning />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Library className="h-6 w-6 text-[hsl(43_65%_52%)]" />
          <div>
            <h1 className="font-serif text-3xl font-bold gold-text">Your Fairy Library</h1>
            <p className="text-sm text-muted-foreground">Books and audiobooks you own — READ ONLY, no downloads</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="black-gold-card aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="black-gold-card p-12 text-center space-y-4">
            <CoinLogo size={48} className="mx-auto" />
            <FairyQuote size="sm" />
            <div>
              <p className="text-lg font-serif gold-text mb-2">Your fairy library is empty</p>
              <p className="text-sm text-muted-foreground">
                Explore the collection and add your first fairy tale.
              </p>
            </div>
            <Link href="/">
              <Button className="gold-gradient text-black font-semibold hover:glow-gold">
                Explore Books
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.type === 'ebook' ? `/books/${item.id}?owned=1` : `/audiobooks/${item.id}?owned=1`}
              >
                <div className="black-gold-card overflow-hidden transition-all duration-300 hover:glow-gold-strong hover:-translate-y-1 group">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-[hsl(0_0%_10%)] to-[hsl(0_0%_5%)] flex items-center justify-center overflow-hidden">
                    {item.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.type === 'audiobook' ? (
                      <Headphones className="h-12 w-12 text-[hsl(43_65%_52%)]" />
                    ) : (
                      <BookOpen className="h-12 w-12 text-[hsl(43_65%_52%)]" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-sm text-green-400 text-[10px] font-medium px-2 py-1 rounded-full border border-green-400/30">
                        <Lock className="h-3 w-3" />
                        Owned
                      </span>
                    </div>
                    {item.type === 'audiobook' && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-sm text-[hsl(43_65%_52%)] text-[10px] font-medium px-2 py-1 rounded-full border border-[hsl(43_65%_52%)]/30">
                          <Headphones className="h-3 w-3" />
                          Audio
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-serif text-base font-bold text-foreground line-clamp-2 group-hover:text-[hsl(43_65%_52%)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{item.authors.join(', ')}</p>
                    <Button
                      size="sm"
                      className="w-full gold-gradient text-black font-semibold hover:glow-gold"
                    >
                      {item.type === 'ebook' ? (
                        <><BookOpen className="h-3 w-3 mr-1" /> Read Now</>
                      ) : (
                        <><Headphones className="h-3 w-3 mr-1" /> Listen Now</>
                      )}
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
