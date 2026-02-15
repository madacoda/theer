import type { Request, Response } from 'express';
import prisma from '../../../infra/db';
import { TicketCategoryResource } from '../../resources/ticket-category-resource';

/**
 * TicketCategoryController
 * Handles CRUD for ticket categories
 */
export class TicketCategoryController {
  /**
   * List all categories
   */
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 15;
      const skip = (page - 1) * perPage;

      const search = (req.query.search as string) || '';
      
      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [categories, total] = await Promise.all([
        prisma.ticketCategory.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.ticketCategory.count({ where })
      ]);

      const path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const meta = TicketCategoryResource.paginate(categories, total, page, perPage, path);

      res.json(TicketCategoryResource.collection(categories, meta, 'Data retrieved successfully'));
    } catch (error) {
      console.error('Index categories error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create a new category
   */
  public async store(req: Request, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;

      const category = await prisma.ticketCategory.create({
        data: {
          title,
          description,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('Store category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single category
   */
  public async find(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      const category = await prisma.ticketCategory.findUnique({
        where: { uuid: uuid as string },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      res.json(TicketCategoryResource.single(category));
    } catch (error) {
      console.error('Show category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update a category
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { title, description } = req.body;

      const category = await prisma.ticketCategory.findUnique({
        where: { uuid: uuid as string },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      const updatedCategory = await prisma.ticketCategory.update({
        where: { uuid: uuid as string },
        data: {
          title,
          description,
        },
      });

      res.json({
        status: 'success',
        message: 'Category updated successfully',
        data: updatedCategory,
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete a category
   */
  public async destroy(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      const category = await prisma.ticketCategory.findUnique({
        where: { uuid: uuid as string },
      });

      if (!category) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      await prisma.ticketCategory.delete({
        where: { uuid: uuid as string },
      });

      res.json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
