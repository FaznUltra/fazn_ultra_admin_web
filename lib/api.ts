import { z } from 'zod';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokens';
import { TokenPairSchema } from './schemas';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.fazn.dev';

class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = TokenPairSchema.parse(await res.json());
  saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit & { schema?: z.ZodType<T>; auth?: boolean } = {},
): Promise<T> {
  const { schema, auth = false, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new ApiError('SESSION_EXPIRED', 'Session expired, please log in again', 401);
    }
  }

  const json = await res.json();

  if (!res.ok) {
    const code = json?.error?.code ?? 'UNKNOWN_ERROR';
    const message = json?.error?.message ?? 'Something went wrong';
    throw new ApiError(code, message, res.status);
  }

  return schema ? schema.parse(json) : (json as T);
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (body: { email: string; username: string; password: string; firstName: string; lastName: string }) =>
      request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    logout: (refreshToken: string) =>
      request('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

    me: () => request('/api/v1/auth/me', { auth: true }),

    sendVerification: (email: string) =>
      request('/api/v1/auth/otp/send-verification', { method: 'POST', body: JSON.stringify({ email }) }),

    verifyEmail: (email: string, otp: string) =>
      request('/api/v1/auth/otp/verify-email', { method: 'POST', body: JSON.stringify({ email, otp }) }),

    forgotPassword: (email: string) =>
      request('/api/v1/auth/otp/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

    resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
      request('/api/v1/auth/otp/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  },
};

export { ApiError };
