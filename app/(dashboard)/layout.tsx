'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth.store';
import { api, ApiError } from '../../lib/api';
import { UserSchema } from '../../lib/schemas';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/games', label: 'Games' },
  ];

  useEffect(() => {
    // Hydrate user from /me on first load
    if (user) { setLoading(false); return; }

    api.auth.me()
      .then((data: any) => {
        const parsed = UserSchema.parse(data.user);
        if (parsed.role !== 'admin') {
          toast.error('Admin access required');
          logout();
          router.push('/login');
        } else {
          setUser(parsed);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.push('/login');
        } else {
          setLoading(false);
        }
      });
  }, []);

  async function handleLogout() {
    const { getRefreshToken } = await import('../../lib/tokens');
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.auth.logout(refreshToken).catch(() => {});
    }
    logout();
    toast.success('Signed out');
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">FAZN</span>
              <span className="hidden sm:inline text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full font-medium">Admin</span>
            </div>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-400">
                {user.first_name} {user.last_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
