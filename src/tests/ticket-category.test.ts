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
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;
const app = createApp();
const secret = process.env.JWT_SECRET || 'supersecret';
const token = jwt.sign({ uuid: 'user-uuid', email: 'admin@mc-theer.com' }, secret);

describe('TicketCategoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ticket/category', () => {
    it('should list all categories', async () => {
      const mockCategories = [
        { id: 1, uuid: 'uuid-1', title: 'Support', description: 'Tech support' },
        { id: 2, uuid: 'uuid-2', title: 'Billing', description: 'Payment issues' },
      ];
      mockedPrisma.ticketCategory.findMany.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/ticket/category')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
      expect(mockedPrisma.ticketCategory.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/ticket/category', () => {
    const newCategory = { title: 'New Category', description: 'New description' };

    it('should create a new category', async () => {
      mockedPrisma.ticketCategory.create.mockResolvedValue({ 
        uuid: 'new-uuid', 
        ...newCategory 
      });

      const response = await request(app)
        .post('/api/ticket/category')
        .set('Authorization', `Bearer ${token}`)
        .send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(newCategory.title);
      expect(mockedPrisma.ticketCategory.create).toHaveBeenCalled();
    });

    it('should fail if title is missing', async () => {
      const response = await request(app)
        .post('/api/ticket/category')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(response.status).toBe(422);
      expect(response.body.errors.title).toBeDefined();
    });
  });

  describe('GET /api/ticket/category/:uuid', () => {
    it('should return a single category', async () => {
      const mockCategory = { uuid: 'uuid-123', title: 'Specific' };
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/ticket/category/uuid-123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Specific');
    });

    it('should return 404 if category not found', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ticket/category/non-existent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/ticket/category/:uuid', () => {
    it('should update an existing category', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue({ uuid: 'uuid-1' });
      mockedPrisma.ticketCategory.update.mockResolvedValue({ uuid: 'uuid-1', title: 'Updated' });

      const response = await request(app)
        .put('/api/ticket/category/uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated');
    });
  });

  describe('DELETE /api/ticket/category/:uuid', () => {
    it('should delete a category', async () => {
      mockedPrisma.ticketCategory.findUnique.mockResolvedValue({ uuid: 'uuid-1' });
      mockedPrisma.ticketCategory.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/ticket/category/uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });
  });
});
