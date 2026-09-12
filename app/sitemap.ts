import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://shanmugavel-bookuniverse.vercel.app'
).replace(/\/+$/, '');

const staticPages: MetadataRoute.Sitemap = [
  { url: siteUrl, changeFrequency: 'daily', priority: 1 },
  { url: `${siteUrl}/ebooks`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${siteUrl}/audiobooks`, changeFrequency: 'daily', priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return staticPages;
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const [ebooksResult, audiobooksResult] = await Promise.all([
      supabase.from('ebooks').select('id'),
      supabase.from('audiobooks').select('id'),
    ]);
    const ebookPages = (ebooksResult.data ?? []).map(({ id }: any) => ({
      url: `${siteUrl}/ebooks/${encodeURIComponent(String(id))}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    const audiobookPages = (audiobooksResult.data ?? []).map(({ id }: any) => ({
      url: `${siteUrl}/audiobooks/${encodeURIComponent(String(id))}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    return [...staticPages, ...ebookPages, ...audiobookPages];
  } catch {
    return staticPages;
  }
}