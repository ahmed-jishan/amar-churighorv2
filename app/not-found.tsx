import Link from 'next/link';
import NeoButton from '@/components/ui/NeoButton';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-8xl font-bold text-gray-200 dark:text-gray-800 mb-4">404</p>
      <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/">
        <NeoButton text="Back to Home"
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
      </Link>
    </div>
  );
}
