'use client';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import { Tag } from 'lucide-react';

export default function OffersPage() {
  const { products, loading } = useProducts({ isActive: true });
  const offers = products.filter(p => p.discountPrice && p.discountPrice < p.price);

  return (
    <div>
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold">Special Offers</h1>
        <p className="text-gray-500 mt-2">Exclusive deals just for you</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
          : offers.length > 0 ? offers.map(p => <ProductCard key={p.id} product={p} />)
          : <div className="col-span-full text-center py-20 text-gray-500">No active offers at the moment. Check back soon!</div>
        }
      </div>
    </div>
  );
}
