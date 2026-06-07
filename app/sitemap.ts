import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/firebase/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://amarchurchighor.com';

  const staticRoutes = [
    { url: BASE, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${BASE}/products`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE}/categories`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE}/offers`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/track-order`, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts({ isActive: true });
    productRoutes = products.map(p => ({
      url: `${BASE}/products/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date(p.updatedAt),
    }));
  } catch {}

  return [...staticRoutes, ...productRoutes];
}
