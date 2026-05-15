'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import { AuthResponseSchema } from '../../../../lib/schemas';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace('/register');
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
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }

    setLoading(true);
    try {
      await api.auth.verifyEmail(email, code);

      // Retrieve the tokens held since registration and log the user in now
      const raw = sessionStorage.getItem('pending_tokens');
      if (raw) {
        const pending = AuthResponseSchema.parse(JSON.parse(raw));
        sessionStorage.removeItem('pending_tokens');
        login(pending);
      }

      toast.success('Email verified! Welcome to FAZN.');
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_OTP') {
        toast.error('Invalid or expired code. Try resending.');
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
      await api.auth.sendVerification(email);
      toast.success('New code sent to your email');
      setCooldown(60);
    } catch {
      toast.error('Failed to resend code. Try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-1">Verify your email</h2>
      <p className="text-gray-400 text-sm mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-purple-400 text-sm font-medium mb-6 truncate">{email}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:opacity-50"
            />
          ))}
        </div>

        <button type="submit" disabled={loading || otp.join('').length < 6} className="w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <Spinner /> : 'Verify email'}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-sm text-gray-400 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive it? Resend"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 animate-pulse h-64" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}
