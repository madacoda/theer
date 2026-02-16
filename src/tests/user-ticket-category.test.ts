import request from 'supertest';
import createApp from '../app';
import prisma from '../infra/db';
import jwt from 'jsonwebtoken';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock Prisma
jest.mock('../infra/db', () => ({
  __esModule: true,
  default: {
    ticketCategory: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;
const app = createApp();
const secret = process.env.JWT_SECRET || 'secret';
const token = jwt.sign({ uuid: 'user-uuid', email: 'user@mc-theer.com' }, secret);

describe('User Ticket Category', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ticket/category', () => {
    it('should list all categories for users', async () => {
      mockedPrisma.ticketCategory.findMany.mockResolvedValue([
        { id: 1, title: 'Support' },
      ]);

      const response = await request(app)
        .get('/api/ticket/category')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
