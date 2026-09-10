'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, BookOpen } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/library';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push(nextUrl);
    });
  }, [router, nextUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
          });
          toast.success('Account created! Welcome to the fairy library.');
          router.push(nextUrl);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
          }).then(() => {});
          toast.success('Welcome back!');
          router.push(nextUrl);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(msg);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen vels-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <CoinLogo size={64} spinning />
          <div className="text-center">
            <h1 className="font-serif text-2xl gold-text font-bold">SHANMUGAVEL'S BOOKSTORE</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">For 5% Thinkers</p>
          </div>
          <FairyQuote size="sm" />
        </div>

        <div className="black-gold-card p-6 md:p-8 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-[hsl(0_0%_8%)] rounded-lg">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-pwd">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient text-black font-semibold hover:glow-gold h-12"
            >
              {loading ? (
                'Entering...'
              ) : (
                <>
                  {mode === 'signup' ? <User className="h-4 w-4 mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                  Enter Vault — For 5% Thinkers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {mode === 'login'
              ? "New here? Switch to Sign Up to join the 5%."
              : 'Already have an account? Switch to Login.'}
          </p>
        </div>
      </div>
    </div>
  );
}
