export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Information We Collect</h2>
          <p>We collect information you provide during checkout: your name, phone number, and delivery address. We do not collect payment information as we use cash-on-delivery only.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How We Use Your Information</h2>
          <p>Your information is used solely for order processing, delivery, and customer support. We do not sell or share your data with third parties except delivery partners.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Data Security</h2>
          <p>Your data is stored securely using Firebase and is protected by industry-standard encryption.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact</h2>
          <p>For privacy concerns, contact us at hello@amarchurchighor.com.</p>
        </section>
      </div>
    </div>
  );
}
