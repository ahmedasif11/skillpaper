process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-must-be-32-chars-min';
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
process.env.SALT_ROUNDS = process.env.SALT_ROUNDS || '4';

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(async () => ({
      newPage: jest.fn(async () => ({
        setViewport: jest.fn(),
        setContent: jest.fn(),
        evaluateHandle: jest.fn(),
        emulateMediaType: jest.fn(),
        pdf: jest.fn(async () => Buffer.from('%PDF-1.4 mock')),
        close: jest.fn(),
      })),
      close: jest.fn(),
    })),
  },
}));
