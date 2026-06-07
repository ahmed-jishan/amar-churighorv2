import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { getProductBySlug } from '@/lib/firebase/products';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.name ?? 'Product',
    description: product?.description,
    openGraph: { images: product?.featuredImage ? [product.featuredImage] : [] },
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductDetailClient params={params} />;
}
