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
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe(registerData.email);
      expect(mockedPrisma.user.create).toHaveBeenCalled();
    });

    it('should fail if email is already in use', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(422);
      expect(response.body.message).toBe('The email has already been taken.');
      expect(response.body.errors.email).toBeDefined();
    });

    it('should fail if validation fails (short password)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...registerData, password: '123' });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
      expect(response.body.message).toContain('at least 6 characters');
    });

    it('should fail if password has no capital letter', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...registerData, password: 'password123', password_confirmation: 'password123' });

      expect(response.status).toBe(422);
      expect(response.body.errors.password).toBeDefined();
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

    it('should fail with incorrect password', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        uuid: 'some-uuid',
        name: 'John Doe',
        email: loginData.email,
        password: await bcrypt.hash('OtherPassword', 10),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail if user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});
