import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shanmugavel-bookuniverse.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shanmugavel's Bookstore | For 5% Thinkers — Shanmugavel M",
    template: "%s | Shanmugavel's Bookstore",
  },
  description: 'Author Direct D2C platform by Shanmugavel M. Premium eBooks and Audiobooks on money, business, life and mindset for the 5% who think differently. Instant delivery.',
  keywords: [
    "Shanmugavel M",
    "Shanmugavel Bookstore",
    "Shanmugavel eBooks",
    "5% Thinkers",
    "Children Books",
    "Business eBooks India",
    "Money Mindset Books",
    "Life with Blessings",
    "Tamil Author eBooks",
    "Ebooks",
    "Audiobook",
    "shan",
    "Vel",
    "Shanmugavel",
    "Gunstory"
      ],
  authors: [{ name: "Shanmugavel M", url: siteUrl }],
  creator: "Shanmugavel M",
  publisher: "Shanmugavel's Bookstore",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: { 
    icon: "/logo.png", 
    apple: "/logo.png",
    shortcut: "/logo.png"
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: "Shanmugavel's Bookstore",
    title: "Shanmugavel's Bookstore | For 5% Thinkers",
    description: 'Premium eBooks and Audiobooks by Shanmugavel M for the 5% who think differently. Author Direct.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: "Shanmugavel's Bookstore - For 5% Thinkers",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shanmugavel's Bookstore | For 5% Thinkers",
    description: 'Premium eBooks and Audiobooks by Shanmugavel M',
    images: ['/logo.png'],
    creator: '@shanmugavel',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Bookstore',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BookStore',
    name: "Shanmugavel's Bookstore",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Author Direct D2C platform by Shanmugavel M. eBooks and Audiobooks for the 5% who think differently.',
    founder: {
      '@type': 'Person',
      name: 'Shanmugavel M',
    },
    sameAs: [
      // Add your socials here
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans vels-bg min-h-screen`}>
        {children}
        <Toaster />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}