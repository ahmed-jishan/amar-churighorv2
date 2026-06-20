'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeoButton from '@/components/ui/NeoButton';
import {
  Mail, Phone, MapPin, MessageSquare, CheckCircle, Clock, Globe,
  Facebook, Instagram, Youtube, Send, Loader2, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ── Contact info cards ──
const CONTACT_CHANNELS = [
  {
    icon: Phone,
    label: 'Phone',
    value: '+880 01344594485',
    hint: 'Sun – Thu, 9:00 AM – 6:00 PM (BST)',
    action: 'tel:+8801344594485',
    cta: 'Call Now',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'mgolam644@gmail.com',
    hint: 'We reply within 24 hours',
    action: 'mailto:mgolam644@gmail.com',
    cta: 'Send Email',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Dhaka, Bangladesh',
    hint: 'Online store — no walk-in location',
    action: 'https://maps.google.com/?q=Dhaka+Bangladesh',
    cta: 'View on Map',
  },
] as const;

const SOCIAL_LINKS = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
] as const;

// ── Email regex for client-side validation ──
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validate ──
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Please enter a valid email';
    if (!form.message.trim()) e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  // ── Shared input style ──
  const inputBase =
    'w-full px-4 py-3 rounded-xl border-2 outline-none transition-all duration-200 text-sm ' +
    'bg-white dark:bg-[#0b2a2b] ' +
    'text-[#1a1a1a] dark:text-gray-200 ' +
    'placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
    'focus:border-[#c9a96e] dark:focus:border-[#e6d3a3]';

  const inputNormal = 'border-gray-200 dark:border-[#1f3334]';
  const inputError = 'border-[#ef4444] dark:border-[#ef4444]';

  // ── Success / Error animation ──
  const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          Get in Touch
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Have a question, feedback, or just want to say hello? We'd love to hear from you.
          Our team typically responds within 24 hours.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 md:gap-12">
        {/* ── Left: Contact info & social ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact channels */}
          <div className="space-y-4">
            {CONTACT_CHANNELS.map(({ icon: Icon, label, value, hint, action, cta }) => (
              <motion.a
                key={label}
                href={action}
                target={action.startsWith('http') ? '_blank' : undefined}
                rel={action.startsWith('http') ? 'noopener noreferrer' : undefined}
                whileHover={{ x: 4 }}
                className="block p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-[#1f3334] 
                  bg-white dark:bg-[#0b2a2b]/50 hover:shadow-lg 
                  dark:hover:border-[#c9a96e]/30 transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#d7ffa4] dark:bg-[#0f2f30] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-[#1a1a1a] dark:text-[#d7ffa4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-sm md:text-base truncate">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{hint}</p>
                    <span className="inline-block mt-2 text-xs font-medium text-[#c9a96e] dark:text-[#e6d3a3] opacity-0 group-hover:opacity-100 transition-opacity">
                      {cta} →
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Social links */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Follow Us</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#0b2a2b] flex items-center justify-center 
                    text-gray-500 dark:text-gray-400 hover:bg-[#d7ffa4] dark:hover:bg-[#0f2f30] 
                    hover:text-[#1a1a1a] dark:hover:text-[#d7ffa4] transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4.5 h-4.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick response badge */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Fast Response</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Contact form ── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {status === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransition}
                className="h-full flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl 
                  bg-[#d7ffa4] dark:bg-[#0f2f30] border border-[#1a1a1a] dark:border-[#c9a96e] text-center"
              >
                <div className="w-20 h-20 rounded-full bg-[rgba(201,169,110,0.15)] 
                  border-2 border-[rgba(201,169,110,0.3)] flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-[#c9a96e]" strokeWidth={2} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-[#e6d3a3] mb-3">
                  Message Sent! 🎉
                </h2>
                <p className="text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70 max-w-sm mx-auto">
                  Thank you for reaching out. We'll review your message and get back to you within 24 hours.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                  In the meantime, check out our{' '}
                  <Link href="/#faq" className="text-[#c9a96e] underline underline-offset-2 hover:no-underline">
                    FAQ
                  </Link>{' '}
                  for quick answers.
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setForm({ name: '', email: '', phone: '', message: '' });
                  }}
                  className="mt-6 text-sm text-[#c9a96e] hover:underline underline-offset-2"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springTransition}
                className="p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-[#1f3334] 
                  bg-white dark:bg-[#0b2a2b]/30 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-[#c9a96e]" />
                  <h2 className="text-lg font-semibold">Send us a message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Full Name <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="John Doe"
                      disabled={status === 'sending'}
                      className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
                    />
                    {errors.name && (
                      <p className="text-[#ef4444] text-[11px] mt-1 ml-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Email Address <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="john@example.com"
                      disabled={status === 'sending'}
                      className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                    />
                    {errors.email && (
                      <p className="text-[#ef4444] text-[11px] mt-1 ml-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Phone Number <span className="text-gray-300 dark:text-gray-600">(optional)</span>
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+880 1712-345678"
                      disabled={status === 'sending'}
                      className={`${inputBase} ${inputNormal}`}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Message <span className="text-[#ef4444]">*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => {
                        setForm({ ...form, message: e.target.value });
                        if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                      }}
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      disabled={status === 'sending'}
                      className={`${inputBase} resize-none ${errors.message ? inputError : inputNormal}`}
                    />
                    {errors.message && (
                      <p className="text-[#ef4444] text-[11px] mt-1 ml-1">{errors.message}</p>
                    )}
                  </div>

                  {/* Error message */}
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                    >
                      <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
                      <p className="text-[12px] text-[#ef4444]">
                        Something went wrong. Please try again or email us directly at{' '}
                        <a href="mailto:hello@amarchurighor.com" className="underline">
                          hello@amarchurighor.com
                        </a>
                        .
                      </p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <NeoButton
                    type="submit"
                    disabled={status === 'sending'}
                    text={status === 'sending' ? 'Sending...' : 'Send Message'}
                    icon={
                      status === 'sending' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )
                    }
                    className="w-full bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] 
                      shadow-[3px_3px_0px_#1a1a1a] 
                      dark:bg-[#c9a96e] dark:text-[#051a1b] dark:border-[#c9a96e] 
                      dark:shadow-[3px_3px_0px_rgba(201,169,110,0.3)]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  <p className="text-[11px] text-gray-400 text-center">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom decorative section ── */}
      <div className="mt-16 md:mt-20 text-center border-t border-gray-100 dark:border-[#1f3334] pt-8 md:pt-10">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <Globe className="w-3.5 h-3.5" />
          <span>Available worldwide — shipping across Bangladesh & international orders</span>
        </div>
      </div>
    </div>
  );
}