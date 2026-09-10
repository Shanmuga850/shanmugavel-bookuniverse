'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingCart, ArrowLeft, Shield, IndianRupee, CheckCircle } from 'lucide-react';
import { SiteHeader } from '@/components/branding/site-header';
import { SiteFooter } from '@/components/branding/site-footer';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  type: 'ebook' | 'audiobook';
  title: string;
  coverUrl?: string;
  mrp: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutDone, setCheckoutDone] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  function loadCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('vels_cart') || '[]');
      setItems(cart);
    } catch {
      setItems([]);
    }
  }

  function removeItem(id: string, type: string) {
    const newItems = items.filter((i) => !(i.id === id && i.type === type));
    setItems(newItems);
    localStorage.setItem('vels_cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('storage'));
    toast.success('Removed from cart');
  }

  function checkout() {
    if (items.length === 0) return;
    // Simulate Razorpay checkout
    toast.success('Redirecting to Razorpay (UPI)...');

    setTimeout(() => {
      // Add to purchases
      try {
        const purchases = JSON.parse(localStorage.getItem('vels_purchases') || '[]');
        items.forEach((item) => {
          purchases.push({ id: item.id, type: item.type, title: item.title, date: new Date().toISOString() });
        });
        localStorage.setItem('vels_purchases', JSON.stringify(purchases));
        localStorage.setItem('vels_cart', '[]');
        setItems([]);
        window.dispatchEvent(new Event('storage'));
        setCheckoutDone(true);
        toast.success('Payment successful! Your books are now in My Books.');
      } catch {
        toast.error('Checkout failed');
      }
    }, 1500);
  }

  const total = items.reduce((sum, item) => sum + item.mrp, 0);

  if (checkoutDone) {
    return (
      <div className="min-h-screen vels-bg">
        <SiteHeader />
        <div className="pt-32 max-w-2xl mx-auto px-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="font-serif text-3xl gold-text font-bold mb-3">Payment Successful</h1>
          <p className="text-muted-foreground mb-6">
            Your books are now available in My Books. Enjoy reading and listening!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/my-books">
              <Button className="gold-gradient text-black font-semibold hover:glow-gold">
                Go to My Books
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-[hsl(43_30%_25%)]">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vels-bg">
      <SiteHeader />

      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(43_65%_52%)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="h-6 w-6 text-[hsl(43_65%_52%)]" />
          <h1 className="font-serif text-3xl font-bold gold-text">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="black-gold-card p-12 text-center">
            <CoinLogo size={48} className="mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link href="/">
              <Button className="gold-gradient text-black font-semibold hover:glow-gold">
                Browse Books
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${item.type}-${index}`} className="black-gold-card p-4 flex gap-4 items-center">
                  <div className="w-16 h-20 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex-shrink-0">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-bold truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    <p className="text-sm gold-text font-bold flex items-center mt-1">
                      <IndianRupee className="h-3 w-3" />
                      {item.mrp}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.type)}
                    className="text-muted-foreground hover:text-red-400 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
                <Shield className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                All books are READ / PLAY ONLY. No downloads.
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="black-gold-card p-6 sticky top-24">
                <h2 className="font-serif text-lg font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />0
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[hsl(43_30%_25%)] flex justify-between font-bold">
                    <span>Total</span>
                    <span className="gold-text flex items-center text-xl">
                      <IndianRupee className="h-4 w-4" />
                      {total}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={checkout}
                  className="w-full mt-4 gold-gradient text-black font-semibold hover:glow-gold"
                >
                  Checkout via Razorpay (UPI)
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  UPI: success@razorpay
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
