'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicFooterSections } from '@/lib/firebase/footer';
import { FooterSection } from '@/types';

/** Shape used internally for rendering */
interface SectionDisplay {
  id: string;
  title: string;
  links: { label: string; url: string; openInNewTab: boolean }[];
}

export default function Footer() {
  const [sections, setSections] = useState<SectionDisplay[] | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    getPublicFooterSections()
      .then((data: FooterSection[]) => {
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
          setSections([]);
        }
      })
      .catch(() => {
        setSections([]);
      });
  }, []);

  // Hardcoded fallback — exactly matches the original footer design
  const fallbackSections: SectionDisplay[] = [
    {
      id: 'shop',
      title: 'Shop',
      links: [
        { label: 'All Products', url: '/products', openInNewTab: false },
        { label: 'Categories', url: '/categories', openInNewTab: false },
        { label: 'Offers', url: '/offers', openInNewTab: false },
      ],
    },
    {
      id: 'help',
      title: 'Help',
      links: [
        { label: 'Track Order', url: '/track-order', openInNewTab: false },
        { label: 'Contact', url: '/contact', openInNewTab: false },
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
      ],
    },
  ];

  // If still loading (null), show nothing to avoid flash of fallback
  // If sections is empty array, use fallback
  // If sections has data, use dynamic data
  const displaySections: SectionDisplay[] =
    sections === null
      ? []
      : sections.length > 0
        ? sections
        : fallbackSections;

  return (
    <footer className="bg-white dark:bg-[#030f10] border-t border-gray-200 dark:border-[#1f3334] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* Grid: brand column takes more space on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column — always first, spans full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent mb-3">
              Amar Churighor
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your trusted destination for premium products in Bangladesh.
            </p>
          </div>

          {/* Dynamic or Fallback Link Columns */}
          {displaySections.map(section => (
            <div key={section.id}>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.url}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                      {...(link.openInNewTab
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-[#1f3334] mt-10 pt-6 text-sm text-gray-400 text-center">
          &copy; {currentYear} Amar Churighor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}