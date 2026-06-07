export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Refund Policy</h1>
      <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
        <section><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Returns</h2><p>You may return products within 7 days of delivery if they are unused, undamaged, and in original packaging.</p></section>
        <section><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How to Return</h2><p>Contact us at hello@amarchurchighor.com or call us. We'll arrange a pickup or guide you through the process.</p></section>
        <section><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Refunds</h2><p>Once we receive and inspect the returned item, refunds are processed within 3-5 business days via mobile banking (bKash/Nagad).</p></section>
        <section><h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Non-Returnable Items</h2><p>Perishable goods, personal care items, and items marked as non-returnable cannot be returned.</p></section>
      </div>
    </div>
  );
}
