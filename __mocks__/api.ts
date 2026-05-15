export const api = {
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    sendVerification: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
  games: {
    options: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    toggle: jest.fn(),
  },
};

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}
