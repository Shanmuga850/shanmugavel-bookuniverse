'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Headphones,
  LayoutDashboard,
  User,
  Plus,
  Library,
  LogOut,
  Shield,
} from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/mybooks', label: 'My Books', icon: Library },
  { href: '/admin/create-ebook', label: 'Create eBook', icon: Plus },
  { href: '/admin/create-audiobook', label: 'Create Audiobook', icon: Headphones },
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/founder', label: 'Founder Profile', icon: User },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const vault = sessionStorage.getItem('founderVault');
    const adminAuth = sessionStorage.getItem('vels_admin_auth');
    if (vault === 'true' || adminAuth === 'true') {
      setAuthed(true);
    } else {
      router.push('/founder-vault');
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen vels-bg flex items-center justify-center">
        <CoinLogo size={48} spinning />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen vels-bg flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  function logout() {
    sessionStorage.removeItem('vels_admin_auth');
    sessionStorage.removeItem('founderVault');
    router.push('/founder-vault');
  }

  return (
    <div className="min-h-screen vels-bg flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[hsl(43_30%_25%)] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 bg-[hsl(0_0%_5%)] z-40">
        <div className="p-6 border-b border-[hsl(43_30%_25%)]">
          <Link href="/admin/mybooks" className="flex items-center gap-3">
            <CoinLogo size={32} />
            <div>
              <div className="font-serif text-sm gold-text font-bold">SHANMUGAVEL'S BOOKSTORE</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Private Vault</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 bg-[hsl(43_65%_52%)]/5 border-b border-[hsl(43_30%_25%)]">
          <Shield className="h-3 w-3 text-[hsl(43_65%_52%)]" />
          <span className="text-xs text-[hsl(43_65%_52%)] font-medium">Vault Live • 3-Step Done</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                    : 'text-muted-foreground hover:bg-[hsl(0_0%_12%)] hover:text-foreground border border-transparent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(43_30%_25%)] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-[hsl(43_65%_52%)]"
          >
            <BookOpen className="h-3 w-3" />
            View Storefront
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-red-400 w-full"
          >
            <LogOut className="h-3 w-3" />
            Exit Vault
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-6 md:p-8">{children}</main>
    </div>
  );
}
