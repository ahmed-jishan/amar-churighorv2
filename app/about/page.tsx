import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Lumin',
  description: 'Discover the story behind Lumin — Bangladesh\'s premier online jewelry destination. Learn about our commitment to quality, craftsmanship, and customer satisfaction.',
  openGraph: {
    title: 'About Lumin | Premium Jewelry Bangladesh',
    description: 'Discover the story behind Lumin — Bangladesh\'s premier online jewelry destination.',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto prose dark:prose-invert">
      <h1 className="text-4xl font-bold mb-6">About Amar Churighor</h1>
      <p className="text-lg text-gray-500 mb-8">Your trusted online destination for premium products in Bangladesh.</p>
      <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
        <p>Amar Churighor was founded with a simple mission: to bring high-quality, carefully curated products to customers across Bangladesh at fair prices, with the convenience of online shopping and the reliability of cash-on-delivery.</p>
        <p>We believe shopping should be joyful, effortless, and trustworthy. Every product in our catalog is hand-selected for quality, and every customer interaction is handled with care.</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Our Values</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Quality products, always</li>
          <li>Transparent pricing with no hidden fees</li>
          <li>Fast, reliable delivery across Bangladesh</li>
          <li>Genuine customer support</li>
          <li>Hassle-free returns</li>
        </ul>
      </div>
    </div>
  );
}
