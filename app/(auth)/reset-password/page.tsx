'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, ApiError } from '../../../lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace('/forgot-password');
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (otp.join('').length < 6) e.otp = 'Enter all 6 digits';
    if (!newPassword) e.newPassword = 'Password is required';
    else if (newPassword.length < 8) e.newPassword = 'Minimum 8 characters';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.auth.resetPassword({ email, otp: otp.join(''), newPassword });
      toast.success('Password updated successfully!');
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_OTP') {
        setErrors((prev) => ({ ...prev, otp: 'Invalid or expired code' }));
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.auth.forgotPassword(email);
      toast.success('New reset code sent');
      setCooldown(60);
    } catch {
      toast.error('Failed to resend code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-1">Reset password</h2>
      <p className="text-gray-400 text-sm mb-1">Enter the code sent to</p>
      <p className="text-purple-400 text-sm font-medium mb-6 truncate">{email}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Reset code</label>
          <div className="flex gap-2 justify-between">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              />
            ))}
          </div>
          {errors.otp && <p className="text-xs text-red-400">{errors.otp}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className={`w-full rounded-lg px-3 py-2.5 bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${errors.newPassword ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}`}
          />
          {errors.newPassword && <p className="text-xs text-red-400">{errors.newPassword}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className={`w-full rounded-lg px-3 py-2.5 bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}`}
          />
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <Spinner /> : 'Reset password'}
        </button>
      </form>

      <div className="flex items-center justify-between mt-6">
        <button onClick={handleResend} disabled={resending || cooldown > 0} className="text-sm text-gray-400 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <Link href="/login" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Back to login</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 animate-pulse h-64" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}
