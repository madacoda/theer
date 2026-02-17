import type { Request, Response } from 'express';
import { TicketService } from '../../services/ticket-service';
import { TicketResource } from '../../resources/ticket-resource';
import { logger } from '../../../infra/logger';

/**
 * TicketController
 * Handles CRUD for tickets
 */
export class TicketController {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  /**
   * List all tickets (Admin sees all)
   */
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      // ... (logic)
      const user = (req as any).user;
      
      const filters = {
        search: (req.query.search as string) || undefined,
        urgency: (req.query.urgency as string) || undefined,
        category: (req.query.category as string) || undefined,
        status: (req.query.status as string) || undefined,
      };

      const { tickets, total } = await this.ticketService.getAll(user.uuid, true, page, perPage, filters);
      
      const path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const meta = TicketResource.paginate(tickets, total, page, perPage, path);

      res.json(TicketResource.collection(tickets, meta, 'Tickets retrieved successfully'));
    } catch (error) {
      logger.error('Index tickets error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create a new ticket
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
      logger.error('Store ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Resolve a ticket
   */
  public async resolve(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { ai_draft } = req.body;
      const user = (req as any).user;

      const updatedTicket = await this.ticketService.resolve(uuid as string, user.uuid, ai_draft);

      res.json({
        status: 'success',
        message: 'Ticket resolved successfully',
        data: updatedTicket,
      });
    } catch (error) {
      logger.error('Resolve ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single ticket
   */
  public async find(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const user = (req as any).user;
      const ticket = await this.ticketService.getByUuid(uuid as string, user.uuid, true);

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      res.json(TicketResource.single(ticket));
    } catch (error) {
      logger.error('Show ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update a ticket
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const updatedTicket = await this.ticketService.update(uuid as string, req.body);

      res.json({
        status: 'success',
        message: 'Ticket updated successfully',
        data: updatedTicket,
      });
    } catch (error) {
      logger.error('Update ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete a ticket
   */
  public async destroy(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      await this.ticketService.delete(uuid as string);

      res.json({
        status: 'success',
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      logger.error('Delete ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
