import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CartDrawer from '@/components/ui/CartDrawer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Amar Churighor | Premium Shopping', template: '%s | Amar Churighor' },
  description: 'Shop premium products at Amar Churighor — your trusted online store in Bangladesh.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://amarchurchighor.com',
    siteName: 'Amar Churighor',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <CartProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  );
}
