import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/firebase/products';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumin.boutique';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: BASE, changeFrequency: 'daily' as const, priority: 1, lastModified: new Date() },
    { url: `${BASE}/products`, changeFrequency: 'daily' as const, priority: 0.9, lastModified: new Date() },
    { url: `${BASE}/categories`, changeFrequency: 'weekly' as const, priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/offers`, changeFrequency: 'daily' as const, priority: 0.9, lastModified: new Date() },
    { url: `${BASE}/about`, changeFrequency: 'monthly' as const, priority: 0.5, lastModified: new Date() },
    { url: `${BASE}/contact`, changeFrequency: 'monthly' as const, priority: 0.5, lastModified: new Date() },
    { url: `${BASE}/track-order`, changeFrequency: 'monthly' as const, priority: 0.6, lastModified: new Date() },
    { url: `${BASE}/collections/featured`, changeFrequency: 'daily' as const, priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/collections/favorites`, changeFrequency: 'weekly' as const, priority: 0.6, lastModified: new Date() },
    { url: `${BASE}/search`, changeFrequency: 'weekly' as const, priority: 0.5, lastModified: new Date() },
    { url: `${BASE}/terms`, changeFrequency: 'monthly' as const, priority: 0.3, lastModified: new Date() },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly' as const, priority: 0.3, lastModified: new Date() },
    { url: `${BASE}/refund`, changeFrequency: 'monthly' as const, priority: 0.3, lastModified: new Date() },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts({ isActive: true });
    productRoutes = products.map(p => ({
      url: `${BASE}/products/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date(p.updatedAt || p.createdAt),
    }));
  } catch {}

  return [...staticRoutes, ...productRoutes];
}