import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import UserLayoutWrapper from '@/components/UserLayoutWrapper';
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
          <UserLayoutWrapper>{children}</UserLayoutWrapper>
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  );
}
