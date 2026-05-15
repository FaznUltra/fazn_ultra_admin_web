const mockStore = {
  user: null as any,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  setUser: jest.fn(),
  setLoading: jest.fn(),
};

export const useAuthStore = jest.fn((selector?: (s: typeof mockStore) => any) =>
  selector ? selector(mockStore) : mockStore,
);

export { mockStore };
