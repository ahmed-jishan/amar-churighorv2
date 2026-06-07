'use client';
import { useState } from 'react';
import NeoButton from '@/components/ui/NeoButton';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-12">We'd love to hear from you. Reach out anytime.</p>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          {[
            { icon: Phone, title: 'Phone', value: '+880 1XXXXXXXXX', hint: 'Sun–Thu, 9am–6pm' },
            { icon: Mail, title: 'Email', value: 'hello@amarchurchighor.com', hint: 'We reply within 24h' },
            { icon: MapPin, title: 'Address', value: 'Dhaka, Bangladesh', hint: 'No walk-in store' },
          ].map(({ icon: Icon, title, value, hint }) => (
            <div key={title} className="flex gap-4">
              <div className="w-12 h-12 bg-[#d7ffa4] dark:bg-[#0f2f30] rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#1a1a1a] dark:text-[#d7ffa4]" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-gray-700 dark:text-gray-300">{value}</p>
                <p className="text-sm text-gray-400">{hint}</p>
              </div>
            </div>
          ))}
        </div>

        {sent ? (
          <div className="bg-[#d7ffa4] dark:bg-[#0f2f30] rounded-2xl p-10 text-center border border-[#1a1a1a] dark:border-[#c9a96e]">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#1a1a1a] dark:text-[#d7ffa4]" />
            <h2 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#e6d3a3] mb-2">Message Sent!</h2>
            <p className="text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70">We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              placeholder="Your Name *" className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#0b2a2b] outline-none focus:border-green-500" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              placeholder="Email Address *" className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#0b2a2b] outline-none focus:border-green-500" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone (optional)" className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#0b2a2b] outline-none focus:border-green-500" />
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={4}
              placeholder="Your message *" className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#0b2a2b] outline-none focus:border-green-500 resize-none" />
            <NeoButton type="submit" text="Send Message"
              className="w-full bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
          </form>
        )}
      </div>
    </div>
  );
}
