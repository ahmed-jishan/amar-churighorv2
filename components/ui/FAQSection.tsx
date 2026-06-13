'use client';
import { useEffect, useState } from 'react';
import { getActiveFAQs } from '@/lib/firebase/content';
import { FaqItem } from '@/types';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_CATEGORIES = ['All', 'Delivery', 'Returns', 'Payment', 'Products', 'General'] as const;

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getActiveFAQs();
        setFaqs(data);
      } catch (e) {
        console.error('Failed to load FAQs:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = activeCategory === 'All'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  const displayFaqs = showAll ? filtered : filtered.slice(0, 5);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) return null;
  if (faqs.length === 0) return null;

  return (
    <section>
      <h2 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
      <p className="text-center text-gray-500 mb-6">Got questions? We have answers.</p>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FAQ_CATEGORIES.map(cat => {
          const count = cat === 'All' ? faqs.length : faqs.filter(f => f.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowAll(false); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-[#d7ffa4] text-[#1a1a1a]'
                  : 'bg-white dark:bg-[#0b2a2b] text-gray-600 dark:text-gray-400 border border-[#1f3334] hover:border-gray-400'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {displayFaqs.map((faq, i) => (
          <div
            key={faq.id}
            className="border border-[#1f3334] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#2a4a4b]"
          >
            <button
              onClick={() => toggleFaq(i)}
              className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-[#0b2a2b] hover:bg-gray-50 dark:hover:bg-[#0f2f30] transition-colors"
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
            >
              <span className="font-semibold text-sm md:text-base pr-4">{faq.question}</span>
              <motion.span
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400 shrink-0"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  id={`faq-answer-${i}`}
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 bg-white dark:bg-[#0b2a2b]">
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filtered.length > 5 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm text-[#d7ffa4] hover:underline py-2"
          >
            Show {filtered.length - 5} more FAQ{filtered.length - 5 !== 1 ? 's' : ''}
          </button>
        )}
      </div>
    </section>
  );
}