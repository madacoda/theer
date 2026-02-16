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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    ticketCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
const userPayload = { uuid: 'user-uuid', email: 'user@mc-theer.com' };
const token = jwt.sign(userPayload, secret);

describe('User Ticket CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ticket/category', () => {
    it('should list all categories for users', async () => {
      mockedPrisma.ticketCategory.findMany.mockResolvedValue([
        { id: 1, title: 'Technical' },
        { id: 2, title: 'Billing' },
      ]);

      const response = await request(app)
        .get('/api/ticket/category')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockedPrisma.ticketCategory.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/ticket', () => {
    it('should list only the logged in user\'s tickets', async () => {
      mockedPrisma.ticket.findMany.mockResolvedValue([
        { uuid: 't-1', title: 'My Ticket', created_by: { uuid: 'user-uuid' } },
      ]);

      const response = await request(app)
        .get('/api/ticket')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(mockedPrisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          AND: [
            { created_by: { uuid: 'user-uuid' } }
          ]
        }
      }));
    });
  });

  describe('POST /api/ticket', () => {
    const ticketData = {
      title: 'Problem',
      content: 'I need help',
      category_id: 1
    };

    it('should create a ticket associated with the user', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue({ id: 1 });
      mockedPrisma.ticket.create.mockResolvedValue({
        uuid: 'new-uuid',
        ...ticketData,
        status: 'open'
      });

      const response = await request(app)
        .post('/api/ticket')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body.data.uuid).toBe('new-uuid');
      expect(mockedPrisma.ticket.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          created_by: { connect: { uuid: 'user-uuid' } }
        })
      }));
    });
  });

  describe('GET /api/ticket/:uuid', () => {
    it('should return the ticket if it belongs to the user', async () => {
      mockedPrisma.ticket.findFirst.mockResolvedValue({
        uuid: 't-1',
        title: 'My Ticket',
        created_by: { uuid: 'user-uuid' }
      });

      const response = await request(app)
        .get('/api/ticket/t-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.uuid).toBe('t-1');
      expect(mockedPrisma.ticket.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          uuid: 't-1',
          created_by: { uuid: 'user-uuid' }
        }
      }));
    });

    it('should return 404 if ticket is not owned by user', async () => {
      mockedPrisma.ticket.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ticket/others-ticket')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('denied');
    });
  });
});
