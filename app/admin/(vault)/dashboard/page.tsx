'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Headphones, IndianRupee, ShoppingCart, HardDrive, TrendingUp } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { supabase } from '@/lib/supabase-client';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEbooks: 0,
    totalAudiobooks: 0,
    publishedEbooks: 0,
    publishedAudiobooks: 0,
    draftEbooks: 0,
    draftAudiobooks: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [ebookRes, audioRes, orderRes] = await Promise.all([
        supabase.from('ebooks').select('id, status, mrp'),
        supabase.from('audiobooks').select('id, status, mrp'),
        supabase.from('orders').select('id, total, status'),
      ]);

      const ebooks = ebookRes.data || [];
      const audiobooks = audioRes.data || [];
      const orders = (orderRes.data || []).filter((o) => o.status === 'completed');

      setStats({
        totalEbooks: ebooks.length,
        totalAudiobooks: audiobooks.length,
        publishedEbooks: ebooks.filter((e) => e.status === 'published').length,
        publishedAudiobooks: audiobooks.filter((a) => a.status === 'published').length,
        draftEbooks: ebooks.filter((e) => e.status === 'draft').length,
        draftAudiobooks: audiobooks.filter((a) => a.status === 'draft').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        totalOrders: orders.length,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const storageUsed = 2.4;
  const storageTotal = 20;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CoinLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl gold-text font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview of your bookstore</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Ebooks */}
        <div className="black-gold-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[hsl(43_65%_52%)]" />
              <h2 className="font-serif text-lg font-bold">Total eBooks</h2>
            </div>
          </div>
          <div className="text-4xl font-bold gold-text">{stats.totalEbooks}</div>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="text-green-400">{stats.publishedEbooks} published</span>
            <span className="text-yellow-400">{stats.draftEbooks} drafts</span>
          </div>
        </div>

        {/* Total Audiobooks */}
        <div className="black-gold-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-[hsl(43_65%_52%)]" />
              <h2 className="font-serif text-lg font-bold">Total Audiobooks</h2>
            </div>
          </div>
          <div className="text-4xl font-bold gold-text">{stats.totalAudiobooks}</div>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="text-green-400">{stats.publishedAudiobooks} published</span>
            <span className="text-yellow-400">{stats.draftAudiobooks} drafts</span>
          </div>
        </div>
      </div>

      {/* Revenue & Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="black-gold-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="h-5 w-5 text-[hsl(43_65%_52%)]" />
            <h2 className="font-serif text-lg font-bold">Revenue</h2>
          </div>
          <div className="text-4xl font-bold gold-text flex items-center">
            <IndianRupee className="h-7 w-7" />
            {stats.totalRevenue}
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm text-green-400">
            <TrendingUp className="h-3 w-3" />
            From {stats.totalOrders} orders
          </div>
        </div>

        <div className="black-gold-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-[hsl(43_65%_52%)]" />
            <h2 className="font-serif text-lg font-bold">Orders</h2>
          </div>
          <div className="text-4xl font-bold gold-text">{stats.totalOrders}</div>
          <p className="mt-3 text-sm text-muted-foreground">Completed purchases</p>
        </div>
      </div>

      {/* Storage */}
      <div className="black-gold-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-5 w-5 text-[hsl(43_65%_52%)]" />
          <h2 className="font-serif text-lg font-bold">Storage (R2 + B2 = 20GB)</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{storageUsed} GB used</span>
            <span className="text-muted-foreground">{storageTotal} GB total</span>
          </div>
          <div className="h-3 bg-[hsl(0_0%_12%)] rounded-full overflow-hidden">
            <div
              className="h-full gold-gradient rounded-full transition-all"
              style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((storageUsed / storageTotal) * 100).toFixed(1)}% utilized — Cloudflare R2 + Backblaze B2 Always Free tier
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">Loading stats...</p>
      )}
    </div>
  );
}
