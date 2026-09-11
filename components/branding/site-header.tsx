'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Library, LogIn, LogOut } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserEmail(data.session?.user.email || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setUserEmail(session?.user.email || null);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('vels_cart') || '[]');
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    const interval = setInterval(updateCart, 1000);
    return () => {
      window.removeEventListener('storage', updateCart);
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#ebooks', label: 'eBooks' },
    { href: '/#audiobooks', label: 'Audiobooks' },
    { href: '/about', label: 'About Founder' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-[hsl(43_30%_25%)]'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <CoinLogo
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-contain"
              spinning={false}
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl gold-text font-bold tracking-wide">
                SHANMUGAVEL'S BOOKSTORE
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                For 5% Thinkers
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-sm hover:text-[hsl(43_65%_52%)] transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[hsl(43_65%_52%)] text-black text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {authed ? (
              <>
                <Link
                  href="/library"
                  className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] transition-colors"
                >
                  <Library className="h-4 w-4" />
                  Library
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-t border-[hsl(43_30%_25%)]">
          <nav className="flex flex-col px-6 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]"
              >
                {link.label}
              </Link>
            ))}
            {authed ? (
              <>
                <Link
                  href="/library"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]"
                >
                  Library
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="text-sm text-muted-foreground hover:text-red-400 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)]"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
