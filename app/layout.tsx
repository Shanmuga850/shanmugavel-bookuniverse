import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: "Shanmugavel's Bookstore | For 5% Thinkers — Shanmugavel M",
  description:
    'Author Direct D2C platform by Shanmugavel M. eBooks and Audiobooks for the 5% who think differently. World is a fantasy, My books are fairies.',
  openGraph: {
    title: "Shanmugavel's Bookstore | For 5% Thinkers",
    description: 'Author Direct D2C by Shanmugavel M',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans vels-bg min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
