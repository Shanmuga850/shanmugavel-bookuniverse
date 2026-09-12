'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ShoppingCart,
  ArrowLeft,
  IndianRupee,
  Shield,
  Eye,
  Lock,
  ExternalLink,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { FairyQuote } from '@/components/branding/fairy-quote';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const FascinatingReader = dynamic(
  () => import('@/components/branding/fascinating-reader').then((m) => m.FascinatingReader),
  { ssr: false, loading: () => (
    <div className="black-gold-border rounded-xl bg-[#0a0a0a] p-12 text-center">
      <Loader2 className="h-8 w-8 text-[hsl(43_65%_52%)] animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground mt-3">Loading reader...</p>
    </div>
  ) }
);
import { supabase } from '@/lib/supabase-client';
import { getSignedUrl } from '@/lib/storage';
import { toast } from 'sonner';

interface EbookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  cover_url: string | null;
  pdf_url: string | null;
  mrp: number;
  visibility: string;
  preview_start: number;
  preview_end: number;
  isbn: string | null;
  publisher: string;
  languages: string[];
  categories: string[];
  about_authors: string | null;
  description: string | null;
  status: string;
  sku: string | null;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const ownedParam = searchParams.get('owned') === '1';

  const [book, setBook] = useState<EbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [owned, setOwned] = useState(false);
  const [showSample, setShowSample] = useState(true);
  const [buying, setBuying] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: bookData } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!bookData) {
        setLoading(false);
        return;
      }
      setBook(bookData);

      // ✅ FIXED: Cloudinary 25GB - support both Supabase and Cloudinary URLs
      let resolvedUrl: string | null = null;
      if (bookData.pdf_url) {
        if (bookData.pdf_url.startsWith('https://res.cloudinary.com')) {
          resolvedUrl = bookData.pdf_url;
        } else if (bookData.pdf_url.startsWith('http')) {
          resolvedUrl = bookData.pdf_url;
        } else {
          try {
            resolvedUrl = await getSignedUrl('book-pdfs', bookData.pdf_url);
          } catch {
            resolvedUrl = bookData.pdf_url;
          }
        }
      }
      setPdfUrl(resolvedUrl || bookData.pdf_url);

      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        setAuthed(true);
        setUserId(session.session.user.id);

        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', session.session.user.id)
          .eq('ebook_id', id)
          .maybeSingle();

        if (purchase) {
          setOwned(true);
        } else if (ownedParam) {
          setOwned(true);
        }
      } else if (ownedParam) {
        // If owned=1 but not logged in, check localStorage (legacy)
        try {
          const localPurchases = JSON.parse(localStorage.getItem('vels_purchases') || '[]');
          if (localPurchases.some((p: { id: string; type: string }) => p.id === id && p.type === 'ebook')) {
            setOwned(true);
          }
        } catch {
          // ignore
        }
      }

      setLoading(false);
    }
    load();
  }, [id, ownedParam]);

  const handleBuy = async () => {
  if (!authed) {
    router.push(`/auth?next=/books/${id}`);
    return;
  }
  if (!book || !userId) return;
  
  setBuying(true);
  try {
    // 1. Create order - ₹1 testing
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(book.mrp * 100) }),
    });
    const order = await res.json();
    
    if (!res.ok || !order.order_id) {
      toast.error("Failed to create order: " + (order.error || "Unknown"));
      setBuying(false);
      return;
    }

    if (!(window as any).Razorpay) {
      toast.error("Payment checkout is unavailable. Please try again.");
      setBuying(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Shanmugavel's Bookstore",
      description: book.title,
      order_id: order.order_id,
      handler: async function (response: any) {
        // 3. Verify payment
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
          // 4. ONLY NOW insert into purchases
          const { error } = await supabase.from("purchases").insert({
            ebook_id: book.id,
            user_id: userId,
            amount: book.mrp
          });
          
          if (error) {
            toast.error("Payment done but library save failed: " + error.message);
          } else {
            toast.success("Payment Success! Book added to library!");
            setOwned(true);
            router.push("/library");
          }
        } else {
          toast.error("Payment verification failed!");
        }
        setBuying(false);
      },
      modal: {
        ondismiss: function() {
          toast.info("Payment cancelled");
          setBuying(false);
        }
      },
      theme: { color: "#D4AF37" }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function () {
      toast.error("Payment failed. Please try again.");
      setBuying(false);
    });
    rzp.open();
  } catch (e: any) {
    toast.error("Buy failed: " + e.message);
    setBuying(false);
  }
};
  function handleReadSample() {
    setShowSample(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen vels-bg">
        <SiteHeader />
        <div className="pt-32 max-w-7xl mx-auto px-6">
          <div className="black-gold-card aspect-[3/4] w-64 animate-pulse mx-auto" />
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
          <h1 className="text-2xl font-serif gold-text mb-4">Book Not Found</h1>
          <Link href="/" className="text-[hsl(43_65%_52%)] hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const showReader = owned || showSample;

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reader Area - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sample banner */}
            {showReader && !owned && (
              <div className="black-gold-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  <span className="text-sm text-muted-foreground">
                    You are reading a free sample. Login to buy the full book for <IndianRupee className="h-3 w-3 inline" />{book.mrp} — For 5% Thinkers
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/auth?next=/books/${book.id}`)}
                  className="gold-gradient text-black font-semibold hover:glow-gold whitespace-nowrap"
                >
                  Login to Buy
                </Button>
              </div>
            )}

            {showReader ? (
              <FascinatingReader
                pdfUrl={pdfUrl}
                isFullAccess={owned}
                previewStart={book.preview_start}
                previewEnd={book.preview_end}
              />
                ) : (
                  <div className="black-gold-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[hsl(43_65%_52%)]" />
                        <h2 className="font-serif text-lg font-bold">Locked Preview</h2>
                      </div>
                    </div>

                    <div className="aspect-[3/4] flex flex-col items-center justify-center gap-4 text-center p-8">
                      <div className="w-32 h-44 rounded-lg overflow-hidden bg-[hsl(0_0%_10%)] flex items-center justify-center mb-2">
                        {book.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-12 w-12 text-[hsl(43_65%_52%)]" />
                        )}
                      </div>
                      <Lock className="h-5 w-5 text-[hsl(43_65%_52%)]" />
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Buy this book to unlock the full reading experience.
                      </p>
                      <Button
                        onClick={handleBuy}
                        className="gold-gradient text-black font-semibold hover:glow-gold"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy for <IndianRupee className="h-3 w-3 inline" />{book.mrp}
                      </Button>
                    </div>
                  </div>
                )}
          </div>

          {/* Book Info Sidebar - 1 col */}
          <div className="space-y-6">
            {/* Cover */}
            {book.cover_url && (
              <div className="black-gold-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={book.cover_url} alt={book.title} className="w-full" />
              </div>
            )}

            {/* Title + Details */}
            <div className="black-gold-card p-6 space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-bold gold-text">{book.title}</h1>
                {book.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{book.subtitle}</p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <DetailRow label="Authors" value={book.authors.join(', ')} />
                {book.isbn && (
                  <DetailRow
                    label="ISBN"
                    value={
                      <a
                        href="https://isbn.international/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[hsl(43_65%_52%)] hover:underline inline-flex items-center gap-1"
                      >
                        {book.isbn}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    }
                  />
                )}
                <DetailRow label="Publisher" value={book.publisher} />
                <DetailRow label="Language" value={book.languages.join(', ')} />
                {book.categories && book.categories.length > 0 && (
                  <DetailRow label="Category" value={book.categories.join(', ')} />
                )}
                {book.sku && <DetailRow label="SKU" value={book.sku} />}
              </div>

              <div className="pt-4 border-t border-[hsl(43_30%_25%)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold gold-text flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {book.mrp}
                  </span>
                </div>

                {owned ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      You own this book
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
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now — <IndianRupee className="h-3 w-3 inline" />{book.mrp}
                        </>
                      )}
                    </Button>
                    {showSample && (
                      <p className="text-xs text-[hsl(43_65%_52%)] text-center pt-1">
                        You are reading a free sample — buy to unlock all pages
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="black-gold-card p-6">
                <h3 className="font-serif text-lg font-bold mb-3">About this book</h3>
                <FairyQuote size="sm" className="mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* About Authors */}
            {book.about_authors && (
              <div className="black-gold-card p-6">
                <h3 className="font-serif text-lg font-bold mb-3">About the Authors</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.about_authors}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}