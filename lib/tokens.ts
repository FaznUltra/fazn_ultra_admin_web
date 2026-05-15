const ACCESS_KEY = 'fazn_access';
const REFRESH_KEY = 'fazn_refresh';

export function saveTokens(accessToken: string, refreshToken: string) {
  // Access token in cookie so middleware can read it
  document.cookie = `${ACCESS_KEY}=${accessToken}; path=/; max-age=900; SameSite=Strict`;
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ACCESS_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  document.cookie = `${ACCESS_KEY}=; path=/; max-age=0`;
  localStorage.removeItem(REFRESH_KEY);
}
