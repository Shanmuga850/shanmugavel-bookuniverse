'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, KeyRound, ArrowRight, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';
import { VELS } from '@/lib/constants';
import { toast } from 'sonner';

export default function FounderVaultPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vaultCode, setVaultCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // REMOVED: const VAULT_CODE and const MOCK_OTP = '123456' - NOW SECURE SERVER CHECK

  async function handleVaultCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/vault/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: vaultCode.trim() }),
      });
      if (res.ok) {
        setStep(2);
        toast.success('Vault code accepted');
      } else {
        setShaking(true);
        toast.error('Invalid vault code');
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      toast.error('Vault verification failed');
    }
    setLoading(false);
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password required');
      return;
    }
    if (email.trim().toLowerCase() !== VELS.adminEmail.toLowerCase()) {
      setShaking(true);
      toast.error('This vault is not for you');
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(`Authentication failed: ${error.message}`);
        setLoading(false);
        return;
      }
      // SEND REAL OTP VIA RESEND
      const otpRes = await fetch('/api/vault/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (otpRes.ok) {
        toast.success('Credentials verified — Real OTP sent to email');
        setStep(3);
      } else {
        toast.error('Failed to send OTP - check Resend config');
      }
    } catch {
      toast.error('Authentication failed');
    }
    setLoading(false);
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      // VERIFY REAL OTP FROM DB - NO MORE 123456
      const res = await fetch('/api/vault/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim(), vaultCode }),
      });
      if (res.ok) {
        sessionStorage.setItem('founderVault', 'true');
        sessionStorage.setItem('vels_admin_auth', 'true');
        toast.success('Vault unlocked — Welcome, Founder');
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setShaking(true);
        toast.error(data.error || 'Invalid OTP');
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      toast.error('Verification failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen vels-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <CoinLogo size={64} spinning />
          <div className="text-center">
            <h1 className="font-serif text-2xl gold-text font-bold">FOUNDER VAULT</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Private Access Only</p>
          </div>
        </div>

        <div className={`black-gold-card p-6 md:p-8 space-y-6 ${shaking ? 'animate-shake' : ''}`}>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? 'w-8 bg-[hsl(43_65%_52%)]' : s < step ? 'w-4 bg-[hsl(43_65%_52%)]/50' : 'w-4 bg-[hsl(0_0%_15%)]'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleVaultCode} className="space-y-4">
              <div className="text-center space-y-2">
                <Lock className="h-10 w-10 text-[hsl(43_65%_52%)] mx-auto" />
                <h2 className="font-serif text-lg gold-text font-bold">Step 1 — Vault Code</h2>
                <p className="text-xs text-muted-foreground">Enter the private vault code to proceed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-code">Vault Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vault-code"
                    type="password"
                    value={vaultCode}
                    onChange={(e) => setVaultCode(e.target.value)}
                    placeholder="Enter vault code"
                    required
                    autoFocus
                    className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)] text-center tracking-widest"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-gradient text-black font-semibold hover:glow-gold h-12">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Unlock <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleEmailPassword} className="space-y-4">
              <div className="text-center space-y-2">
                <Shield className="h-10 w-10 text-[hsl(43_65%_52%)] mx-auto" />
                <h2 className="font-serif text-lg gold-text font-bold">Step 2 — Founder Credentials</h2>
                <p className="text-xs text-muted-foreground">Sign in with your founder email and password</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="vault-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="founder@email.com" required autoFocus className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-pwd">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="vault-pwd" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="pl-9 pr-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-gradient text-black font-semibold hover:glow-gold h-12">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : <>Verify & Send OTP <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="text-center space-y-2">
                <KeyRound className="h-10 w-10 text-[hsl(43_65%_52%)] mx-auto" />
                <h2 className="font-serif text-lg gold-text font-bold">Step 3 — OTP Verification</h2>
                <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your email</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault-otp">6-Digit OTP</Label>
                <Input id="vault-otp" type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" required autoFocus className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)] text-center text-2xl tracking-[0.5em] font-mono" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-gradient text-black font-semibold hover:glow-gold h-12">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : <>Enter Vault <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>
          )}

          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="text-xs text-muted-foreground hover:text-[hsl(43_65%_52%)] w-full text-center">
              ← Back to Step {step - 1}
            </button>
          )}
        </div>

        <FairyQuote size="sm" />
      </div>
    </div>
  );
}