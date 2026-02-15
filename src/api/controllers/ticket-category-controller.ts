import type { Request, Response } from 'express';
import prisma from '../../infra/db';
import { TicketCategoryResource } from '../resources/ticket-category-resource';

/**
 * TicketCategoryController (User)
 * Publicly available categories for selection
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
          orderBy: { title: 'asc' },
          skip,
          take: perPage,
        }),
        prisma.ticketCategory.count({ where })
      ]);

      const path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const meta = TicketCategoryResource.paginate(categories, total, page, perPage, path);

      res.json(TicketCategoryResource.collection(categories, meta, 'Ticket categories retrieved successfully'));
    } catch (error) {
      console.error('User index ticket categories error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
