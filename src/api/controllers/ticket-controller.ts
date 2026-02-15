import type { Request, Response } from 'express';
import { TicketService } from '../services/ticket-service';
import { TicketResource } from '../resources/ticket-resource';

/**
 * TicketController (User)
 * Handles ticket operations for regular users
 */
export class TicketController {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  /**
   * List user's own tickets
   */
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const user = (req as any).user;
      
      const filters = {
        search: (req.query.search as string) || undefined,
        urgency: (req.query.urgency as string) || undefined,
        category: (req.query.category as string) || undefined,
        status: (req.query.status as string) || undefined,
      };

      const { tickets, total } = await this.ticketService.getAll(user.uuid, false, page, perPage, filters);

      const path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const meta = TicketResource.paginate(tickets, total, page, perPage, path);

      res.json(TicketResource.collection(tickets, meta, 'Your tickets retrieved successfully'));
    } catch (error) {
      console.error('User index tickets error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create a new ticket (stored as current user)
   */
  public async store(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const ticket = await this.ticketService.create(req.body, user.uuid);

      res.status(201).json({
        status: 'success',
        message: 'Ticket received. Our AI is triaging it now.',
        data: {
          uuid: ticket.uuid,
          title: ticket.title,
          status: ticket.status,
        },
      });
    } catch (error) {
      console.error('User store ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single ticket (must be owner)
   */
  public async find(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const user = (req as any).user;
      const ticket = await this.ticketService.getByUuid(uuid as string, user.uuid, false);

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found or access denied',
        });
        return;
      }

      res.json(TicketResource.single(ticket));
    } catch (error) {
      console.error('User show ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
