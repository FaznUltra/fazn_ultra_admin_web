export const useRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn() }));
export const useSearchParams = jest.fn(() => ({ get: jest.fn(() => null) }));
export const usePathname = jest.fn(() => '/');
