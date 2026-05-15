import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

function makeReq(pathname: string, token?: string): NextRequest {
  const url = `http://localhost${pathname}`;
  const headers = new Headers();
  if (token) headers.set('cookie', `fazn_access=${token}`);
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  it('allows unauthenticated access to /login', () => {
    const req = makeReq('/login');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /register', () => {
    const req = makeReq('/register');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /forgot-password', () => {
    const req = makeReq('/forgot-password');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('redirects unauthenticated user from / to /login', () => {
    const req = makeReq('/');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('includes from param when redirecting to login', () => {
    const req = makeReq('/some-protected-page');
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('from=%2Fsome-protected-page');
  });

  it('redirects authenticated user from /login to /', () => {
    const req = makeReq('/login', 'some-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });

  it('redirects authenticated user from /register to /', () => {
    const req = makeReq('/register', 'some-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });

  it('allows authenticated user to access /', () => {
    const req = makeReq('/', 'some-token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /register/verify', () => {
    const req = makeReq('/register/verify?email=test%40fazn.dev');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows authenticated user to access /register/verify (mid-flow page)', () => {
    // tokens are held in sessionStorage until OTP verified — cookie may not be set yet,
    // but even if it is, /register/verify must never redirect away
    const req = makeReq('/register/verify?email=test%40fazn.dev', 'some-token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('redirects authenticated user from /reset-password to /', () => {
    const req = makeReq('/reset-password', 'some-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });
});
