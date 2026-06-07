'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/firebase/auth';
import NeoButton from '@/components/ui/NeoButton';
import { Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(email, password);
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030f10] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[#051a1b] rounded-2xl border border-[#1f3334] p-8"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#d7ffa4] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Amar Churighor Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Email" className="w-full pl-10 pr-4 py-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Password" className="w-full pl-10 pr-4 py-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <NeoButton type="submit" text={loading ? 'Logging in...' : 'Login'} disabled={loading}
            className="w-full bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
        </form>
      </motion.div>
    </div>
  );
}