import request from 'supertest';
import createApp from '../app';
import prisma from '../infra/db';
import bcrypt from 'bcryptjs';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock Prisma
jest.mock('../infra/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;
const app = createApp();

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const registerData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      password_confirmation: 'Password123',
    };

    it('should register a new user successfully', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue({
        uuid: 'some-uuid',
        name: registerData.name,
        email: registerData.email,
        roles: []
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(mockedPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'john@example.com',
      password: 'Password123',
    };

    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginData.password, 10);
      mockedPrisma.user.findUnique.mockResolvedValue({
        uuid: 'some-uuid',
        name: 'John Doe',
        email: loginData.email,
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
    });
  });
});
