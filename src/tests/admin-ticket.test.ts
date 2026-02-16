import request from 'supertest';
import createApp from '../app';
import prisma from '../infra/db';
import jwt from 'jsonwebtoken';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock RabbitMQ
jest.mock('../infra/rabbitmq', () => ({
  __esModule: true,
  initRabbitMQ: jest.fn(),
  enqueueJob: jest.fn(),
  TICKET_QUEUE: 'triage-ticket',
}));

// Mock Prisma
jest.mock('../infra/db', () => ({
  __esModule: true,
  default: {
    ticket: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    }
  },
}));

const mockedPrisma = prisma as any;
const app = createApp();
const secret = process.env.JWT_SECRET || 'secret';

// Admin payload (needs to match what adminMiddleware expects)
const adminPayload = { uuid: 'admin-uuid', email: 'admin@mc-theer.com' };
const adminToken = jwt.sign(adminPayload, secret);

describe('Admin Ticket CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for admin check in middleware
    mockedPrisma.user.findUnique.mockResolvedValue({
      uuid: 'admin-uuid',
      roles: [{ role: { name: 'admin' } }]
    });
  });

  describe('GET /api/admin/ticket', () => {
    it('should list all tickets for admin', async () => {
      mockedPrisma.ticket.findMany.mockResolvedValue([
        { uuid: 't-1', title: 'User Ticket 1' },
        { uuid: 't-2', title: 'User Ticket 2' },
      ]);

      const response = await request(app)
        .get('/api/admin/ticket')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockedPrisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {}
      }));
    });
  });

  describe('PUT /api/admin/ticket/:uuid/resolve', () => {
    it('should resolve a ticket', async () => {
      mockedPrisma.ticket.update.mockResolvedValue({
        uuid: 't-1',
        status: 'resolved'
      });

      const response = await request(app)
        .put('/api/admin/ticket/t-1/resolve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ai_draft: 'Fixed' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('resolved');
      expect(mockedPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { uuid: 't-1' },
        data: expect.objectContaining({ status: 'resolved' })
      }));
    });
  });
});
