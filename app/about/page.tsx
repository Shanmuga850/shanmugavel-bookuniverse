'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { supabase } from '@/lib/supabase-client';

interface FounderData {
  name: string;
  bio: string | null;
  fairy_quote: string;
  coin_logo_url: string | null;
  tagline: string;
  founder_image_1_url: string | null;
  founder_image_2_url: string | null;
}

export default function AboutPage() {
  const [founder, setFounder] = useState<FounderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('founder_profile')
        .select('name, bio, fairy_quote, coin_logo_url, tagline, founder_image_1_url, founder_image_2_url')
        .eq('id', 1)
        .maybeSingle();
      setFounder(data);
      setLoading(false);
    }
    load();
  }, []);

  const displayFounder = founder || {
    name: 'Shanmugavel M',
    bio: '',
    fairy_quote: 'World is a fantasy, My books are fairies, let my fairy guide you to explore the fantasy',
    coin_logo_url: null,
    tagline: 'For 5% THINKERS',
    founder_image_1_url: null,
    founder_image_2_url: null,
  };

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <div className="pt-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {loading ? (
          <div className="black-gold-card p-12 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-[hsl(0_0%_12%)] mx-auto mb-6" />
            <div className="h-8 bg-[hsl(0_0%_12%)] rounded mx-auto w-48 mb-4" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Founder Hero */}
            <div className="black-gold-card p-8 md:p-12 text-center space-y-6">
              {displayFounder.coin_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayFounder.coin_logo_url}
                  alt={displayFounder.name}
                  className="w-24 h-24 rounded-full gold-border mx-auto object-cover"
                />
              ) : (
                <CoinLogo size={64} spinning className="mx-auto" />
              )}

              <div>
                <h1 className="font-serif text-4xl font-bold gold-text">{displayFounder.name}</h1>
                <p className="text-sm text-muted-foreground tracking-widest uppercase mt-2">
                  {displayFounder.tagline}
                </p>
              </div>

              <div className="max-w-2xl mx-auto py-4">
                <FairyQuote size="md" />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                shanmugavelvetri@gmail.com
              </div>
            </div>

            {/* Founder Images */}
            {(displayFounder.founder_image_1_url || displayFounder.founder_image_2_url) && (
              <div className="black-gold-card p-8 md:p-10">
                <h2 className="font-serif text-2xl font-bold mb-6 text-center gold-text">The Author</h2>
                {displayFounder.founder_image_1_url && displayFounder.founder_image_2_url ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayFounder.founder_image_1_url}
                      alt={`${displayFounder.name} - Image 1`}
                      className="w-full h-[400px] object-cover rounded-2xl border-2 border-[#D4AF37] glow-gold"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayFounder.founder_image_2_url}
                      alt={`${displayFounder.name} - Image 2`}
                      className="w-full h-[400px] object-cover rounded-2xl border-2 border-[#D4AF37] glow-gold"
                    />
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayFounder.founder_image_1_url || displayFounder.founder_image_2_url || ''}
                      alt={displayFounder.name}
                      className="w-full h-[400px] object-cover rounded-2xl border-2 border-[#D4AF37] glow-gold"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {displayFounder.bio && (
              <div className="black-gold-card p-8 md:p-10">
                <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[hsl(43_65%_52%)]" />
                  Founder's Story
                </h2>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {displayFounder.bio}
                </p>
              </div>
            )}

            {/* Philosophy */}
            <div className="black-gold-card p-8 md:p-10 text-center">
              <h2 className="font-serif text-2xl font-bold gold-text mb-6">The 5% Philosophy</h2>
              <div className="space-y-4 text-muted-foreground max-w-2xl mx-auto">
                <p>
                  Most people live in the 95% — accepting the world as it is presented to them.
                  But there is a 5% who question, who explore, who dare to see the world differently.
                </p>
                <p>
                  Shanmugavel's Bookstore exists for that 5%. For the thinkers, the dreamers, the ones who
                  understand that the world is a fantasy — and that books are the fairies that guide us
                  through it.
                </p>
                <FairyQuote size="sm" className="pt-4" />
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 gold-gradient text-black font-semibold px-8 py-3 rounded-full hover:glow-gold transition-all"
              >
                Explore the Books
              </Link>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
