import request from 'supertest';
import createApp from '../app';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect } from '@jest/globals';

// Mock Prisma to avoid DB connection issues during middleware tests
jest.mock('../infra/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const app = createApp();

describe('AuthMiddleware', () => {
  const secret = process.env.JWT_SECRET || 'supersecret';

  it('should allow access with valid token', async () => {
    const token = jwt.sign({ uuid: '123', email: 'test@example.com' }, secret);
    
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.email).toBe('test@example.com');
  });

  it('should deny access with no token', async () => {
    const response = await request(app)
      .get('/api/profile');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('No token provided');
  });

  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid or expired token');
  });
});
