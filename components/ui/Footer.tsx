'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicFooterSections } from '@/lib/firebase/footer';
import { getFooterConfig, FooterConfig } from '@/lib/firebase/footerConfig';
import { FooterSection } from '@/types';
import { Facebook, Instagram, Youtube, MessageCircle, CreditCard, DollarSign, Landmark } from 'lucide-react';

interface SectionDisplay {
  id: string;
  title: string;
  links: { label: string; url: string; openInNewTab: boolean }[];
}

const STATIC_SECTIONS: SectionDisplay[] = [
  {
    id: 'shop',
    title: 'Shop',
    links: [
      { label: 'All Products', url: '/products', openInNewTab: false },
      { label: 'Categories', url: '/categories', openInNewTab: false },
      { label: 'New Arrivals', url: '/products?sort=newest', openInNewTab: false },
      { label: 'Best Sellers', url: '/products', openInNewTab: false },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    links: [
      { label: 'Track Order', url: '/track-order', openInNewTab: false },
      { label: 'My Orders', url: '/my-orders', openInNewTab: false },
      { label: 'Contact Us', url: '/contact', openInNewTab: false },
      { label: 'FAQ', url: '/#faq', openInNewTab: false },
      { label: 'Refund Policy', url: '/refund', openInNewTab: false },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', url: '/privacy', openInNewTab: false },
      { label: 'Terms of Service', url: '/terms', openInNewTab: false },
      { label: 'About Us', url: '/about', openInNewTab: false },
      { label: 'Returns Policy', url: '/refund', openInNewTab: false },
    ],
  },
];

const PAYMENT_BADGES: Record<string, { label: string; className: string; icon: any }> = {
  cod: { label: 'Cash on Delivery', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: DollarSign },
  bkash: { label: 'bKash', className: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300', icon: CreditCard },
  nagad: { label: 'Nagad', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300', icon: CreditCard },
  rocket: { label: 'Rocket', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300', icon: Landmark },
};

const SOCIAL_ICONS: Record<string, { icon: typeof Facebook; color: string }> = {
  facebook: { icon: Facebook, color: 'hover:text-blue-500' },
  instagram: { icon: Instagram, color: 'hover:text-pink-500' },
  whatsapp: { icon: MessageCircle, color: 'hover:text-green-500' },
  youtube: { icon: Youtube, color: 'hover:text-red-500' },
  'message-circle': { icon: MessageCircle, color: 'hover:text-green-500' },
};

export default function Footer() {
  const [sections, setSections] = useState<SectionDisplay[] | null>(null);
  const [config, setConfig] = useState<FooterConfig | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      getPublicFooterSections(),
      getFooterConfig(),
    ]).then(([data, cfg]) => {
      if (data.length > 0) {
        setSections(
          data.map(s => ({
            id: s.id,
            title: s.title,
            links: s.links.map(l => ({
              label: l.label,
              url: l.url,
              openInNewTab: l.open_in_new_tab,
            })),
          }))
        );
      } else {
        setSections(STATIC_SECTIONS);
      }
      setConfig(cfg);
    }).catch(() => {
      setSections(STATIC_SECTIONS);
      setConfig(null);
    });
  }, []);

  const displaySections = sections ?? [];
  const footerConfig = config;

  // Determine which payment methods to show (use array format if available, else fallback)
  const paymentMethodsArray = footerConfig?.paymentMethodsArray?.filter(pm => pm.isActive) || [];
  const paymentMethodsKeys = paymentMethodsArray.length > 0
    ? paymentMethodsArray.map(pm => pm.id)
    : (footerConfig?.paymentMethods || ['cod', 'bkash', 'nagad', 'rocket']);

  // Determine which social links to show (use array format if available, else legacy object)
  const socialLinksArray = footerConfig?.socialLinksArray?.filter(sl => sl.isActive && sl.url) || [];
  const hasSocialArray = socialLinksArray.length > 0;

  return (
    <footer className="bg-white dark:bg-[#030f10] border-t border-gray-200 dark:border-[#1f3334] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:w-72 shrink-0">
            {/* Brand Logo */}
            {footerConfig?.brandLogo ? (
              <img 
                src={footerConfig.brandLogo} 
                alt="Amar Churighor" 
                className="h-10 md:h-12 object-contain mb-2"
              />
            ) : (
              <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent mb-2">
                Amar Churighor
              </h3>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              {footerConfig?.tagline || 'Your trusted jewelry destination'}
            </p>
            {/* Social Links - Array format */}
            {hasSocialArray && (
              <div className="flex gap-2 mt-4">
                {socialLinksArray.map(social => {
                  const socialDef = SOCIAL_ICONS[social.icon] || SOCIAL_ICONS[social.platform];
                  if (!socialDef) return null;
                  const Icon = socialDef.icon;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-[#0b2a2b] flex items-center justify-center text-gray-500 dark:text-gray-400 ${socialDef.color} transition-colors`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
            {/* Social Links - Legacy format (fallback) */}
            {!hasSocialArray && footerConfig?.socialLinks && (
              <div className="flex gap-2 mt-4">
                {Object.entries(footerConfig.socialLinks).filter(([, url]) => url).map(([platform, url]) => {
                  const social = SOCIAL_ICONS[platform];
                  if (!social) return null;
                  const Icon = social.icon;
                  return (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-[#0b2a2b] flex items-center justify-center text-gray-500 dark:text-gray-400 ${social.color} transition-colors`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sections Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {displaySections.map(section => (
              <div key={section.id}>
                <h4 className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                  {section.title}
                </h4>
                <ul className="space-y-2 md:space-y-2.5">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.url}
                        className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                        {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-[#1f3334] mt-8 md:mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs md:text-sm text-gray-400 text-center md:text-left">
            &copy; {currentYear} Amar Churighor. {footerConfig?.copyrightText || 'All rights reserved.'}
          </p>

          {/* Payment Badges with Circle Icons */}
          <div className="flex flex-wrap justify-center gap-2">
            {paymentMethodsKeys.map(method => {
              const badge = PAYMENT_BADGES[method];
              if (!badge) return null;
              const Icon = badge.icon;
              return (
                <span
                  key={method}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-full ${badge.className}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {badge.label}
                </span>
              );
            })}
          </div>

          <p className="text-[10px] md:text-xs text-gray-400 text-center">
            Made with ❤️ in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}