'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicFooterSections } from '@/lib/firebase/footer';
import { getFooterConfig, FooterConfig } from '@/lib/firebase/footerConfig';
import { Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

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

/** Payment method config — actual brand images with squircle card style (squared, slight radius) */
const PAYMENT_METHODS: Record<string, {
  label: string;
  bgClass: string;
  borderClass: string;
  imgSrc?: string;
  isImage: boolean;
  icon?: string;
}> = {
  cod: {
    label: 'Cash on Delivery',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800/40',
    isImage: false,
    icon: '$',
  },
  bkash: {
    label: 'bKash',
    bgClass: 'bg-pink-50 dark:bg-pink-950/30',
    borderClass: 'border-pink-200 dark:border-pink-800/40',
    imgSrc: '/bkash.svg',
    isImage: true,
  },
  nagad: {
    label: 'Nagad',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800/40',
    imgSrc: '/nagad.png',
    isImage: true,
  },
  rocket: {
    label: 'Rocket',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800/40',
    imgSrc: '/rocket.svg',
    isImage: true,
  },
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

  const paymentMethodsArray = footerConfig?.paymentMethodsArray?.filter(pm => pm.isActive) || [];
  const paymentMethodsKeys = paymentMethodsArray.length > 0
    ? paymentMethodsArray.map(pm => pm.id)
    : (footerConfig?.paymentMethods || ['cod', 'bkash', 'nagad', 'rocket']);

  const socialLinksArray = footerConfig?.socialLinksArray?.filter(sl => sl.isActive && sl.url) || [];
  const hasSocialArray = socialLinksArray.length > 0;

  /** Render a single payment badge — squared card style, responsive for mobile */
  const renderPaymentBadge = (method: string) => {
    const pm = PAYMENT_METHODS[method];
    if (!pm) return null;

    return (
      <span
        key={method}
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border text-[10px] sm:text-[11px] font-semibold shadow-sm ${pm.bgClass} ${pm.borderClass}`}
      >
        {pm.isImage && pm.imgSrc ? (
          <span className="relative w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
            <Image
              src={pm.imgSrc}
              alt={pm.label}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 16px, 20px"
            />
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-bold leading-none">{pm.icon}</span>
        )}
        <span className="text-[10px] sm:text-[11px] leading-none whitespace-nowrap">{pm.label}</span>
      </span>
    );
  };

  return (
    <footer className="bg-white dark:bg-[#030f10] border-t border-gray-200 dark:border-[#1f3334] mt-auto overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Brand Column — fully isolated from sections */}
          <div className="lg:w-72 shrink-0 footer-brand-column">
            {footerConfig?.brandLogo ? (
              (() => {
                const preset = footerConfig.brandLogoSizePreset || '350x75';
                const width = footerConfig.brandLogoWidth || (preset === '250x150' ? 250 : preset === '400x100' ? 400 : 350);
                const height = footerConfig.brandLogoHeight || (preset === '250x150' ? 150 : preset === '400x100' ? 100 : 75);
                const shape = footerConfig.brandLogoShape || 'rounded';
                const borderRadius = shape === 'circle' ? '9999px' : shape === 'rounded' ? '12px' : '0px';
                const scale = footerConfig.brandingImageScale ?? 1.0;

                const displayWidth = shape === 'circle' ? Math.min(width, height, 180) : width;
                const displayHeight = shape === 'circle' ? Math.min(width, height, 180) : height;

                return (
                  <div className="footer-brand-unit">
                    {/* Floating premium card with golden glow */}
                    <div
                      className="footer-brand-glow"
                      style={{ borderRadius, maxWidth: '100%' }}
                    >
                      <div
                        className="footer-brand-card footer-brand-shadow overflow-hidden relative"
                        style={{
                          borderRadius,
                          width: '100%',
                          maxWidth: displayWidth,
                          height: displayHeight,
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <img
                          src={footerConfig.brandLogo}
                          alt="Amar Churighor"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius,
                            transform: `scale(${scale})`,
                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Tagline */}
                    <div className="footer-brand-tagline-wrapper">
                      <p className="footer-brand-tagline text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-3">
                        {footerConfig?.tagline || 'Your trusted jewelry destination'}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="footer-brand-unit">
                <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent mb-2">
                  Amar Churighor
                </h3>
                <div className="footer-brand-tagline-wrapper">
                  <p className="footer-brand-tagline text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {footerConfig?.tagline || 'Your trusted jewelry destination'}
                  </p>
                </div>
              </div>
            )}

            {/* Social Links - Array format with golden floating glow */}
            {hasSocialArray && (
              <div className="flex gap-3 mt-5">
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
                      className="social-icon-golden w-9 h-9 rounded-full bg-gray-100 dark:bg-[#0b2a2b] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all duration-300"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
            {/* Social Links - Legacy format (fallback) with golden floating glow */}
            {!hasSocialArray && footerConfig?.socialLinks && (
              <div className="flex gap-3 mt-5">
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
                      className="social-icon-golden w-9 h-9 rounded-full bg-gray-100 dark:bg-[#0b2a2b] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all duration-300"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Payment Method Badges — professional squared card style */}
            <div className="mt-5">
              <div className="bg-white/70 dark:bg-[#0b2a2b]/60 backdrop-blur-sm rounded-md border border-gray-100 dark:border-[#1f3334]/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.15)] p-3.5 flex flex-wrap gap-2">
                {paymentMethodsKeys.map(method => renderPaymentBadge(method))}
              </div>
            </div>
          </div>

          {/* Sections Grid — fully separate, never overlaps brand */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 min-w-0">
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

        {/* Bottom Bar — simplified without payment methods */}
        <div className="border-t border-gray-200 dark:border-[#1f3334] mt-8 md:mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs md:text-sm text-gray-400 text-center md:text-left inline-flex items-center gap-0">
            <img
              src="/luminnav.png"
              alt=""
              className="h-[1.5rem] md:h-[1.5rem] w-auto object-contain inline-block dark:brightness-0 dark:invert"
            />
            {currentYear} Lumin. {footerConfig?.copyrightText || 'All rights reserved.'}
          </p>
          <p className="text-[10px] md:text-xs text-gray-400 text-center">
            Made with ❤️ in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}