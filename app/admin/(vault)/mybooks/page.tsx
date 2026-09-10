'use client';

import { useState, useEffect } from 'react';
import {
  Library,
  BookOpen,
  Headphones,
  Edit2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface Ebook {
  id: string;
  title: string;
  cover_url: string | null;
  mrp: number;
  status: string;
  visibility: string;
  sku: string | null;
  authors: string[];
}

interface Audiobook {
  id: string;
  title: string;
  cover_url: string | null;
  mrp: number;
  status: string;
  sku: string | null;
  authors: string[];
}

export default function AdminMyBooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [tab, setTab] = useState<'ebooks' | 'audiobooks'>('ebooks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ebookRes, audioRes] = await Promise.all([
      supabase.from('ebooks').select('*').order('created_at', { ascending: false }),
      supabase.from('audiobooks').select('*').order('created_at', { ascending: false }),
    ]);
    setEbooks(ebookRes.data || []);
    setAudiobooks(audioRes.data || []);
    setLoading(false);
  }

  async function deleteEbook(id: string) {
    if (!confirm('Delete this eBook? This cannot be undone.')) return;
    const { error } = await supabase.from('ebooks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('eBook deleted');
      loadData();
    }
  }

  async function deleteAudiobook(id: string) {
    if (!confirm('Delete this audiobook? This cannot be undone.')) return;
    const { error } = await supabase.from('audiobooks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Audiobook deleted');
      loadData();
    }
  }

  async function toggleVisibility(id: string, current: string) {
    const newVal = current === 'public' ? 'private' : 'public';
    const { error } = await supabase.from('ebooks').update({ visibility: newVal }).eq('id', id);
    if (error) {
      toast.error('Failed to update visibility');
    } else {
      toast.success(`Visibility: ${newVal}`);
      loadData();
    }
  }

  async function duplicateEbook(ebook: Ebook) {
    const { data, error } = await supabase
      .from('ebooks')
      .insert({
        title: `${ebook.title} (Copy)`,
        authors: ebook.authors,
        mrp: ebook.mrp,
        status: 'draft',
        visibility: 'private',
        publisher: 'SHANMUGAVEL BOOKUNIVERSE',
      })
      .select()
      .maybeSingle();
    if (error) {
      toast.error('Failed to duplicate');
    } else {
      toast.success('eBook duplicated as draft');
      loadData();
    }
  }

  const draftEbooks = ebooks.filter((e) => e.status === 'draft').length;
  const draftAudios = audiobooks.filter((a) => a.status === 'draft').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CoinLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl gold-text font-bold">My Books</h1>
          <p className="text-xs text-muted-foreground">Manage your eBooks and Audiobooks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('ebooks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'ebooks'
              ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
              : 'text-muted-foreground hover:bg-[hsl(0_0%_12%)] border border-transparent'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          My eBooks ({ebooks.length})
          {draftEbooks > 0 && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {draftEbooks} drafts
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('audiobooks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'audiobooks'
              ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
              : 'text-muted-foreground hover:bg-[hsl(0_0%_12%)] border border-transparent'
          }`}
        >
          <Headphones className="h-4 w-4" />
          My Audiobooks ({audiobooks.length})
          {draftAudios > 0 && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {draftAudios} drafts
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="black-gold-card h-48 animate-pulse" />
          ))}
        </div>
      ) : tab === 'ebooks' ? (
        <div className="space-y-4">
          <Link href="/admin/create-ebook">
            <Button className="gold-gradient text-black font-semibold hover:glow-gold">
              <Plus className="h-4 w-4 mr-2" />
              Create New eBook
            </Button>
          </Link>
          {ebooks.length === 0 ? (
            <div className="black-gold-card p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No eBooks yet. Create your first one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ebooks.map((book) => (
                <div key={book.id} className="black-gold-card p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-24 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex-shrink-0">
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-sm font-bold line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">GUNSTORY style</p>
                      <p className="text-sm gold-text font-bold flex items-center mt-1">
                        <IndianRupee className="h-3 w-3" />
                        {book.mrp}
                      </p>
                      {book.sku && <p className="text-[10px] text-muted-foreground font-mono">{book.sku}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          book.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {book.status}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          book.visibility === 'public'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {book.visibility}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[hsl(43_30%_25%)]">
                    <Link href={`/admin/create-ebook?edit=${book.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 text-xs hover:text-[hsl(43_65%_52%)]">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs hover:text-[hsl(43_65%_52%)]"
                      onClick={() => duplicateEbook(book)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs hover:text-[hsl(43_65%_52%)]"
                      onClick={() => toggleVisibility(book.id, book.visibility)}
                    >
                      {book.visibility === 'public' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs hover:text-red-400 ml-auto"
                      onClick={() => deleteEbook(book.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Link href="/admin/create-audiobook">
            <Button className="gold-gradient text-black font-semibold hover:glow-gold">
              <Plus className="h-4 w-4 mr-2" />
              Create New Audiobook
            </Button>
          </Link>
          {audiobooks.length === 0 ? (
            <div className="black-gold-card p-12 text-center">
              <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No Audiobooks yet. Create your first one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audiobooks.map((book) => (
                <div key={book.id} className="black-gold-card p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-24 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex-shrink-0">
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Headphones className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-sm font-bold line-clamp-2">{book.title}</h3>
                      <p className="text-sm gold-text font-bold flex items-center mt-1">
                        <IndianRupee className="h-3 w-3" />
                        {book.mrp}
                      </p>
                      {book.sku && <p className="text-[10px] text-muted-foreground font-mono">{book.sku}</p>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${
                        book.status === 'published'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {book.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[hsl(43_30%_25%)]">
                    <Link href={`/admin/create-audiobook?edit=${book.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 text-xs hover:text-[hsl(43_65%_52%)]">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs hover:text-red-400 ml-auto"
                      onClick={() => deleteAudiobook(book.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
