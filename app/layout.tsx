import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import AnonymousIdentity from '@/components/AnonymousIdentity';
import UserLayoutWrapper from '@/components/UserLayoutWrapper';
import AnalyticsTrackerWrapper from '@/components/analytics/AnalyticsTrackerWrapper';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumin.boutique';
const SITE_NAME = 'Lumin';
const SITE_DESCRIPTION = 'Discover premium jewelry and accessories at Lumin — Bangladesh\'s most trusted online jewelry store. Shop exquisite rings, necklaces, bracelets, earrings, and churi with confidence.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Premium Jewelry & Accessories`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: ['jewelry', 'Bangladesh jewelry', 'premium accessories', 'rings', 'necklaces', 'bracelets', 'earrings', 'churi', 'online jewelry store Bangladesh', 'Lumin'],
  authors: [{ name: 'Lumin' }],
  creator: 'Lumin',
  publisher: 'Lumin',
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Premium Jewelry & Accessories`,
    description: SITE_DESCRIPTION,
    countryName: 'Bangladesh',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Premium Jewelry & Accessories`,
    description: SITE_DESCRIPTION,
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
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
      'bn-BD': SITE_URL,
    },
  },
  category: 'jewelry',
  classification: 'E-commerce',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/luminnav.png`,
              description: SITE_DESCRIPTION,
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'BD',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+880-1XXX-XXXXXX',
                contactType: 'customer service',
                availableLanguage: ['English', 'Bengali'],
              },
              sameAs: [
                SITE_URL,
              ],
            }),
          }}
        />
        {/* JSON-LD WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
              description: SITE_DESCRIPTION,
              inLanguage: ['en-US', 'bn-BD'],
            }),
          }}
        />
        {/* Canonical link */}
        <link rel="canonical" href={SITE_URL} />
        {/* Hreflang tags */}
        <link rel="alternate" href={SITE_URL} hrefLang="en-US" />
        <link rel="alternate" href={SITE_URL} hrefLang="bn-BD" />
        <link rel="alternate" href={SITE_URL} hrefLang="x-default" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <CartProvider>
          <AnonymousIdentity />
          <AnalyticsTrackerWrapper />
          <UserLayoutWrapper>{children}</UserLayoutWrapper>
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  );
}