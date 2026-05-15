'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email) { setError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return false; }
    setError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      // Always show success — backend doesn't reveal if email exists
      toast.success('If that email exists, a reset code has been sent');
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-1">Forgot password?</h2>
      <p className="text-gray-400 text-sm mb-6">Enter your email and we&apos;ll send you a reset code</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@fazn.dev"
            disabled={loading}
            className={`w-full rounded-lg px-3 py-2.5 bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${error ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}`}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <Spinner /> : 'Send reset code'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}
