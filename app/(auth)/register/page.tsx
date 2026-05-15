'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, ApiError } from '../../../lib/api';
import { AuthResponseSchema } from '../../../lib/schemas';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.username) e.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,32}$/.test(form.username)) e.username = '3–32 chars, letters, numbers, underscores only';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = AuthResponseSchema.parse(
        await api.auth.register({
          email: form.email,
          username: form.username,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      );

      // Hold tokens until email is verified — store temporarily, do NOT call login() yet
      sessionStorage.setItem('pending_tokens', JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }));
      toast.success('Account created! Check your email for a verification code.');
      router.push(`/register/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'USER_EXISTS') toast.error('Email or username already in use');
        else toast.error(err.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-1">Create account</h2>
      <p className="text-gray-400 text-sm mb-6">Admin access only</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName}>
            <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="John" className={input(errors.firstName)} disabled={loading} />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Doe" className={input(errors.lastName)} disabled={loading} />
          </Field>
        </div>

        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="admin@fazn.dev" className={input(errors.email)} disabled={loading} />
        </Field>

        <Field label="Username" error={errors.username}>
          <input type="text" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="adminuser" className={input(errors.username)} disabled={loading} />
        </Field>

        <Field label="Password" error={errors.password}>
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" className={input(errors.password)} disabled={loading} />
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword}>
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" className={input(errors.confirmPassword)} disabled={loading} />
        </Field>

        <button type="submit" disabled={loading} className={btn(loading)}>
          {loading ? <Spinner /> : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function input(err?: string) {
  return `w-full rounded-lg px-3 py-2.5 bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${err ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}`;
}

function btn(loading: boolean) {
  return `w-full flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'cursor-not-allowed' : ''}`;
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>;
}
