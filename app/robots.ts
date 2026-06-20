import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumin.boutique';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cart'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/admin', '/api', '/cart'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/admin', '/api', '/cart'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}