import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#030f10] border-t border-[#1f3334] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent mb-3">
              Amar Churighor
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your trusted destination for premium products in Bangladesh.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/products" className="hover:text-green-600 transition">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-green-600 transition">Categories</Link></li>
              <li><Link href="/offers" className="hover:text-green-600 transition">Offers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Help</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/track-order" className="hover:text-green-600 transition">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-green-600 transition">Contact</Link></li>
              <li><Link href="/refund" className="hover:text-green-600 transition">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-green-600 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-green-600 transition">Terms of Service</Link></li>
              <li><Link href="/about" className="hover:text-green-600 transition">About Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#1f3334] mt-10 pt-6 text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} Amar Churighor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
