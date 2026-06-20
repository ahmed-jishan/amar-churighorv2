import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { getProductBySlug } from '@/lib/firebase/products';
import { formatPrice } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumin.boutique';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: 'Product Not Found | Lumin',
      description: 'The requested product could not be found.',
    };
  }
  const title = `${product.name} | Lumin Premium Jewelry`;
  const description = product.description || `Shop ${product.name} at Lumin — premium quality jewelry in Bangladesh.`;
  const images = product.featuredImage ? [product.featuredImage] : [];
  return {
    title,
    description,
    keywords: [product.name, product.category || 'jewelry', 'Lumin', 'premium jewelry Bangladesh', ...(product.tags || [])].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${slug}`,
      images,
      type: 'article',
      publishedTime: product.createdAt,
      modifiedTime: product.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: `${SITE_URL}/products/${slug}`,
    },
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductDetailClient params={params} />;
}