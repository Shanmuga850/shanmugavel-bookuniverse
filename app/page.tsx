'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, Headphones, Sparkles, ArrowRight, X } from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { BookCard } from '@/components/branding/book-card';
import { supabase } from '@/lib/supabase-client';
import { VELS } from '@/lib/constants';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  mrp: number;
  authors: string[];
  sku: string | null;
  status: string;
}

interface Audiobook {
  id: string;
  title: string;
  cover_url: string | null;
  mrp: number;
  authors: string[];
  sku: string | null;
  status: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q')?.toLowerCase().trim() || '';

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [founderName, setFounderName] = useState(VELS.founder.name);
  const [founderTagline, setFounderTagline] = useState(VELS.founder.tagline);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [ebookRes, audioRes, founderRes] = await Promise.all([
        supabase
          .from('ebooks')
          .select('id, title, subtitle, cover_url, mrp, authors, sku, status')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('audiobooks')
          .select('id, title, cover_url, mrp, authors, sku, status')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('founder_profile')
          .select('name, tagline')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      setEbooks(ebookRes.data || []);
      setAudiobooks(audioRes.data || []);
      if (founderRes.data) {
        setFounderName(founderRes.data.name);
        setFounderTagline(founderRes.data.tagline);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // FILTER LOGIC
  const filteredEbooks = useMemo(() => {
    if (!query) return ebooks;
    return ebooks.filter((book) => {
      const haystack = `${book.title} ${book.subtitle || ''} ${book.authors.join(' ')} ${book.sku || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [ebooks, query]);

  const filteredAudiobooks = useMemo(() => {
    if (!query) return audiobooks;
    return audiobooks.filter((book) => {
      const haystack = `${book.title} ${book.authors.join(' ')} ${book.sku || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [audiobooks, query]);

  const totalResults = filteredEbooks.length + filteredAudiobooks.length;

  const clearSearch = () => {
    router.push('/#ebooks');
  };

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      {/* Hero Section - Hide when searching */}
      {!query && (
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[hsl(43_65%_52%)] opacity-[0.03] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(43_65%_52%)] opacity-[0.02] rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col items-center text-center gap-8 animate-fade-in-up">
              <CoinLogo
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                spinning
              />
              <div className="space-y-4">
                <h1 className="font-serif text-5xl md:text-7xl font-bold gold-text">
                  {founderTagline}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  by {founderName}
                </p>
              </div>

              <div className="max-w-3xl py-6">
                <FairyQuote size="lg" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link
                  href="#ebooks"
                  className="inline-flex items-center gap-2 gold-gradient text-black font-semibold px-8 py-3 rounded-full hover:glow-gold transition-all"
                >
                  <BookOpen className="h-5 w-5" />
                  Explore eBooks
                </Link>
                <Link
                  href="#audiobooks"
                  className="inline-flex items-center gap-2 border border-[hsl(43_30%_25%)] text-foreground hover:text-[hsl(43_65%_52%)] hover:border-[hsl(43_65%_52%)] font-semibold px-8 py-3 rounded-full transition-all"
                >
                  <Headphones className="h-5 w-5" />
                  Explore Audiobooks
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEARCH RESULT BANNER */}
      {query && !loading && (
        <section className="pt-28 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between black-gold-card px-6 py-4">
              <p className="text-sm text-foreground">
                Showing <span className="text-[hsl(43_65%_52%)] font-bold">{totalResults}</span> results for <span className="font-bold gold-text">"{searchParams.get('q')}"</span>
              </p>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-2 text-xs border border-[hsl(43_30%_25%)] px-4 py-2 rounded-full hover:border-red-400 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>
        </section>
      )}

      {/* eBooks Section */}
      <section id="ebooks" className={`py-16 px-4 sm:px-6 lg:px-8 ${query ? 'pt-6' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6 text-[hsl(43_65%_52%)]" />
            <h2 className="font-serif text-3xl font-bold gold-text">eBooks {query && `(${filteredEbooks.length})`}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[hsl(43_30%_25%)] to-transparent" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="black-gold-card aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : filteredEbooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredEbooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  subtitle={book.subtitle || undefined}
                  coverUrl={book.cover_url || undefined}
                  mrp={book.mrp}
                  authors={book.authors}
                  sku={book.sku || undefined}
                  type="ebook"
                />
              ))}
            </div>
          ) : (
            <div className="black-gold-card p-12 text-center">
              <Sparkles className="h-10 w-10 text-[hsl(43_65%_52%)] mx-auto mb-4" />
              <p className="text-muted-foreground">
                {query ? `No eBooks found for "${searchParams.get('q')}"` : 'No eBooks published yet. Check back soon.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Audiobooks Section */}
      <section id="audiobooks" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Headphones className="h-6 w-6 text-[hsl(43_65%_52%)]" />
            <h2 className="font-serif text-3xl font-bold gold-text">Audiobooks {query && `(${filteredAudiobooks.length})`}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[hsl(43_30%_25%)] to-transparent" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="black-gold-card aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : filteredAudiobooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAudiobooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  coverUrl={book.cover_url || undefined}
                  mrp={book.mrp}
                  authors={book.authors}
                  sku={book.sku || undefined}
                  type="audiobook"
                />
              ))}
            </div>
          ) : (
            <div className="black-gold-card p-12 text-center">
              <Sparkles className="h-10 w-10 text-[hsl(43_65%_52%)] mx-auto mb-4" />
              <p className="text-muted-foreground">
                {query ? `No audiobooks found for "${searchParams.get('q')}"` : 'No audiobooks published yet. Check back soon.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* About Founder CTA - Hide when searching */}
      {!query && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto black-gold-card p-10 text-center space-y-6">
            <CoinLogo size={56} />
            <h2 className="font-serif text-2xl md:text-3xl gold-text font-bold">
              {VELS.founder.name}
            </h2>
            <FairyQuote size="md" />
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-[hsl(43_65%_52%)] hover:gap-3 transition-all"
            >
              Read the Founder's Story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen vels-bg flex items-center justify-center"><p className="gold-text">Loading...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}