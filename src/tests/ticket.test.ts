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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ticketCategory: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;
const app = createApp();
const secret = process.env.JWT_SECRET || 'supersecret';
const token = jwt.sign({ uuid: 'user-uuid', email: 'user@mc-theer.com' }, secret);

describe('TicketController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ticket', () => {
    it('should list all tickets', async () => {
      mockedPrisma.ticket.findMany.mockResolvedValue([
        { uuid: 't-1', title: 'Problem 1', status: 'open' },
      ]);

      const response = await request(app)
        .get('/api/ticket')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/ticket', () => {
    const validTicket = {
      title: 'New Ticket',
      content: 'Help me',
      category_id: 1,
    };

    it('should create a new ticket', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue({ id: 1 });
      mockedPrisma.ticket.create.mockResolvedValue({
        id: 1,
        uuid: 'new-ticket-uuid',
        ...validTicket,
      });

      const response = await request(app)
        .post('/api/ticket')
        .set('Authorization', `Bearer ${token}`)
        .send(validTicket);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(validTicket.title);
      expect(mockedPrisma.ticket.create).toHaveBeenCalled();
    });

    it('should fail if category_id does not exist', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ticket')
        .set('Authorization', `Bearer ${token}`)
        .send(validTicket);

      expect(response.status).toBe(422);
      expect(response.body.errors.category_id).toBeDefined();
    });
  });

  describe('GET /api/ticket/:uuid', () => {
    it('should return a single ticket', async () => {
      mockedPrisma.ticket.findUnique.mockResolvedValue({ uuid: 't-1', title: 'Found' });

      const response = await request(app)
        .get('/api/ticket/t-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Found');
    });

    it('should return 404 if ticket not found', async () => {
      mockedPrisma.ticket.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ticket/non-existent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/ticket/:uuid', () => {
    it('should update a ticket', async () => {
      mockedPrisma.ticket.findUnique.mockResolvedValue({ uuid: 't-1' });
      mockedPrisma.ticket.update.mockResolvedValue({ uuid: 't-1', title: 'Updated' });

      const response = await request(app)
        .put('/api/ticket/t-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated');
    });
  });

  describe('DELETE /api/ticket/:uuid', () => {
    it('should delete a ticket', async () => {
      mockedPrisma.ticket.findUnique.mockResolvedValue({ uuid: 't-1' });
      mockedPrisma.ticket.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/ticket/t-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });
  });
});
