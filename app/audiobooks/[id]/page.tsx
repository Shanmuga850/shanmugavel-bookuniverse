'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Headphones,
  ShoppingCart,
  ArrowLeft,
  IndianRupee,
  Shield,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Lock,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { getSignedUrl } from '@/lib/storage';
import { toast } from 'sonner';

interface AudioChapter {
  id: string;
  chapter_no: number;
  title: string;
  mp3_url: string | null;
  duration: number;
}

interface AudiobookDetail {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  sample_audio_url: string | null;
  mrp: number;
  language: string;
  opening_url: string | null;
  ending_url: string | null;
  description: string | null;
  status: string;
  sku: string | null;
}

export default function AudiobookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownedParam = searchParams.get('owned') === '1';
  const id = params.id as string;
  const [book, setBook] = useState<AudiobookDetail | null>(null);
  const [chapters, setChapters] = useState<AudioChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [resolvedTracks, setResolvedTracks] = useState<Record<number, string>>({});
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadBook() {
      const [bookRes, chapterRes] = await Promise.all([
        supabase.from('audiobooks').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('audio_chapters')
          .select('*')
          .eq('audiobook_id', id)
          .order('chapter_no', { ascending: true }),
      ]);

      if (bookRes.data) setBook(bookRes.data);
      setChapters(chapterRes.data || []);

      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        setAuthed(true);
        setUserId(session.session.user.id);
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', session.session.user.id)
          .eq('audiobook_id', id)
          .maybeSingle();
        if (purchase) setPurchased(true);
      } else if (ownedParam) {
        setPurchased(true);
      }

      // Resolve audio URLs for all tracks (signed URLs for private bucket)
      const b = bookRes.data;
      if (b) {
        const tracksToResolve: { index: number; bucket: string; path: string | null }[] = [];
        if (b.sample_audio_url) tracksToResolve.push({ index: -1, bucket: 'audiobook-files', path: b.sample_audio_url });
        if (b.opening_url) tracksToResolve.push({ index: -2, bucket: 'audiobook-files', path: b.opening_url });
        if (b.ending_url) tracksToResolve.push({ index: -3, bucket: 'audiobook-files', path: b.ending_url });
        (chapterRes.data || []).forEach((c, i) => {
          if (c.mp3_url) tracksToResolve.push({ index: i, bucket: 'audiobook-files', path: c.mp3_url });
        });
        const entries = await Promise.all(
          tracksToResolve.map(async (t) => [t.index, await getSignedUrl(t.bucket, t.path)] as const)
        );
        setResolvedTracks(Object.fromEntries(entries));
      }

      setLoading(false);
    }
    loadBook();
  }, [id, ownedParam]);

  // Build playlist: opening -> chapters -> ending
  const playlist = buildPlaylist(book, chapters, purchased);

  function buildPlaylist(b: AudiobookDetail | null, chaps: AudioChapter[], hasPurchased: boolean) {
    if (!b) return [];
    const tracks: { label: string; url: string | null; type: string; trackIndex: number }[] = [];
    tracks.push({ label: 'Opening Credits', url: b.opening_url, type: 'opening', trackIndex: -2 });
    chaps.forEach((c, i) => {
      tracks.push({
        label: `${String(c.chapter_no).padStart(2, '0')}. ${c.title}`,
        url: c.mp3_url,
        type: 'chapter',
        trackIndex: i,
      });
    });
    tracks.push({ label: 'Ending Credits', url: b.ending_url, type: 'ending', trackIndex: -3 });
    if (!hasPurchased && b.sample_audio_url) {
      return [{ label: 'Free Sample', url: b.sample_audio_url, type: 'sample', trackIndex: -1 }];
    }
    return tracks;
  }

  const playTrack = useCallback((index: number) => {
    if (index < 0 || index >= playlist.length) return;
    const track = playlist[index];
    const resolvedUrl = track.trackIndex !== undefined ? resolvedTracks[track.trackIndex] : undefined;
    const finalUrl = resolvedUrl || track.url;
    if (!finalUrl) {
      toast.error('Audio file not available for this track');
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = finalUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
      });
    }
    setCurrentTrack(finalUrl);
    setCurrentTrackIndex(index);
  }, [playlist, resolvedTracks]);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const onTime = () => setCurrentTime(audio.currentTime);
      const onDur = () => setDuration(audio.duration);
      const onEnd = () => {
        if (currentTrackIndex < playlist.length - 1) {
          playTrack(currentTrackIndex + 1);
        } else {
          setIsPlaying(false);
        }
      };
      audio.addEventListener('timeupdate', onTime);
      audio.addEventListener('loadedmetadata', onDur);
      audio.addEventListener('ended', onEnd);
      return () => {
        audio.removeEventListener('timeupdate', onTime);
        audio.removeEventListener('loadedmetadata', onDur);
        audio.removeEventListener('ended', onEnd);
      };
    }
  }, [currentTrackIndex, playlist.length, playTrack]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTrackIndex === -1 && playlist.length > 0) {
        playTrack(0);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  }

  async function handleBuy() {
    if (!book) return;
    if (!authed || !userId) {
      toast.info('Please login to purchase');
      router.push(`/auth?next=/audiobooks/${book.id}`);
      return;
    }
    setBuying(true);
    try {
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(book.mrp * 100) }),
      });
      const order = await orderResponse.json();

      if (!orderResponse.ok || !order.order_id) {
        toast.error(`Failed to create order: ${order.error || 'Unknown error'}`);
        setBuying(false);
        return;
      }

      if (!(window as any).Razorpay) {
        toast.error('Payment checkout is unavailable. Please try again.');
        setBuying(false);
        return;
      }

      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Shanmugavel's Bookstore",
        description: book.title,
        order_id: order.order_id,
        handler: async (response: any) => {
          const verifyResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verification = await verifyResponse.json();

          if (!verifyResponse.ok || !verification.success) {
            toast.error('Payment verification failed.');
            setBuying(false);
            return;
          }

          const { error } = await supabase
            .from('purchases')
            .insert({ user_id: userId, audiobook_id: book.id, ebook_id: null, amount: book.mrp });
          if (error) {
            if (error.code === '23505') {
              toast.info('You already own this audiobook');
              setPurchased(true);
            } else {
              toast.error(`Payment succeeded but library save failed: ${error.message}`);
            }
          } else {
            toast.success('Payment successful! Added to your library.');
            setPurchased(true);
            setTimeout(() => router.push('/library'), 1000);
          }
          setBuying(false);
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setBuying(false);
          },
        },
        theme: { color: '#D4AF37' },
      });

      razorpay.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setBuying(false);
      });
      razorpay.open();
    } catch (error: any) {
      toast.error(`Purchase failed: ${error.message || 'Unknown error'}`);
      setBuying(false);
    }
  }

  function formatTime(s: number) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen vels-bg">
        <SiteHeader />
        <div className="pt-32 max-w-7xl mx-auto px-6">
          <div className="black-gold-card aspect-square w-64 animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen vels-bg">
        <SiteHeader />
        <div className="pt-32 max-w-7xl mx-auto px-6 text-center">
          <CoinLogo size={56} className="mx-auto mb-4" />
          <h1 className="text-2xl font-serif gold-text mb-4">Audiobook Not Found</h1>
          <Link href="/" className="text-[hsl(43_65%_52%)] hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <audio
        ref={audioRef}
        onContextMenu={(e) => e.preventDefault()}
        className="hidden"
        onError={() => {
          if (currentTrackIndex >= 0) {
            toast.error('Audio failed to load for this track. The file may not be available yet.');
            setIsPlaying(false);
          }
        }}
      />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Audio Player Area - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player */}
            <div className="black-gold-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-[hsl(43_65%_52%)]" />
                  <h2 className="font-serif text-lg font-bold">
                    {purchased ? 'Full Audiobook' : 'Sample Player'}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-[hsl(43_65%_52%)] bg-[hsl(43_65%_52%)]/10 px-3 py-1 rounded-full">
                  <Shield className="h-3 w-3" />
                  PLAY ONLY
                </span>
              </div>

              {/* Cover + Now Playing */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-48 h-48 rounded-2xl overflow-hidden gold-border">
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[hsl(0_0%_8%)]">
                      <Headphones className="h-16 w-16 text-[hsl(43_65%_52%)]" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-serif text-xl font-bold gold-text">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentTrackIndex >= 0 ? playlist[currentTrackIndex]?.label : 'Select a track to begin'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 mb-4">
                <div
                  className="h-2 bg-[hsl(0_0%_12%)] rounded-full cursor-pointer"
                  onClick={seek}
                >
                  <div
                    className="h-full gold-gradient rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => currentTrackIndex > 0 && playTrack(currentTrackIndex - 1)}
                  disabled={currentTrackIndex <= 0}
                  className="text-muted-foreground hover:text-[hsl(43_65%_52%)] disabled:opacity-30"
                >
                  <SkipBack className="h-6 w-6" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full gold-gradient text-black flex items-center justify-center hover:glow-gold transition-all"
                >
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                </button>
                <button
                  onClick={() => currentTrackIndex < playlist.length - 1 && playTrack(currentTrackIndex + 1)}
                  disabled={currentTrackIndex >= playlist.length - 1}
                  className="text-muted-foreground hover:text-[hsl(43_65%_52%)] disabled:opacity-30"
                >
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> PLAY ONLY</span>
                <span>|</span>
                <span>No Download</span>
                <span>|</span>
                <span>No Source Access</span>
              </div>
            </div>

            {/* Chapter List */}
            <div className="black-gold-card p-6">
              <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                Track List
              </h3>
              <div className="space-y-2">
                {playlist.map((track, index) => (
                  <button
                    key={index}
                    onClick={() => playTrack(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      currentTrackIndex === index
                        ? 'bg-[hsl(43_65%_52%)]/10 border border-[hsl(43_65%_52%)]/30'
                        : 'hover:bg-[hsl(0_0%_12%)] border border-transparent'
                    }`}
                  >
                    <span className={`text-sm font-mono w-6 ${currentTrackIndex === index ? 'text-[hsl(43_65%_52%)]' : 'text-muted-foreground'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`flex-1 text-sm ${currentTrackIndex === index ? 'text-[hsl(43_65%_52%)]' : 'text-foreground'}`}>
                      {track.label}
                    </span>
                    {!purchased && track.type !== 'sample' && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {currentTrackIndex === index && isPlaying && (
                      <div className="flex gap-0.5 items-end h-4">
                        <div className="w-0.5 h-2 bg-[hsl(43_65%_52%)] animate-pulse" />
                        <div className="w-0.5 h-4 bg-[hsl(43_65%_52%)] animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 h-3 bg-[hsl(43_65%_52%)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {!purchased && (
                <div className="mt-4 p-4 rounded-lg bg-[hsl(43_65%_52%)]/5 border border-[hsl(43_65%_52%)]/20 text-center">
                  <Lock className="h-5 w-5 text-[hsl(43_65%_52%)] mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    You are listening to a free sample. Purchase to unlock all tracks.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {book.cover_url && (
              <div className="black-gold-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={book.cover_url} alt={book.title} className="w-full" />
              </div>
            )}

            <div className="black-gold-card p-6 space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-bold gold-text">{book.title}</h1>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Authors</span>
                  <span>{book.authors.join(', ')}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Language</span>
                  <span>{book.language}</span>
                </div>
                {book.sku && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">SKU</span>
                    <span className="font-mono">{book.sku}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[hsl(43_30%_25%)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold gold-text flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {book.mrp}
                  </span>
                </div>

                {purchased ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      You own this audiobook
                    </div>
                    <Link href="/library">
                      <Button variant="outline" className="w-full border-[hsl(43_30%_25%)] hover:border-[hsl(43_65%_52%)]">
                        Go to Library
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleBuy}
                      disabled={buying}
                      className="w-full gold-gradient text-black font-semibold hover:glow-gold"
                    >
                      {buying ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-2" />Buy Now — <IndianRupee className="h-3 w-3 inline" />{book.mrp}</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      {authed ? 'Click to buy and listen instantly' : 'Login required to buy'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {book.description && (
              <div className="black-gold-card p-6">
                <h3 className="font-serif text-lg font-bold mb-3">About this audiobook</h3>
                <FairyQuote size="sm" className="mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
