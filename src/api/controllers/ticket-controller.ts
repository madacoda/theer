import type { Request, Response } from 'express';
import prisma from '../../infra/db';
import { enqueueJob, TICKET_QUEUE } from '../../infra/rabbitmq';

/**
 * TicketController
 * Handles CRUD for tickets
 */
export class TicketController {
  /**
   * List all tickets
   */
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const tickets = await prisma.ticket.findMany({
        include: {
          category: true,
          created_by: {
            select: {
              uuid: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        status: 'success',
        message: 'Tickets retrieved successfully',
        data: tickets,
      });
    } catch (error) {
      console.error('Index tickets error:', error);
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
      const { title, content, category_id, status } = req.body;
      const currentUser = (req as any).user;

      const ticket = await prisma.ticket.create({
        data: {
          title,
          content,
          category_id,
          status: status || 'open',
          created_by: currentUser ? { connect: { uuid: currentUser.uuid } } : undefined,
        },
        include: {
          category: true,
        },
      });

      // Enqueue job for AI triage
      await enqueueJob(TICKET_QUEUE, { ticketId: ticket.id });

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
      console.error('Store ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Resolve a ticket
   * Updates AI draft and sets status to resolved
   */
  public async resolve(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const { ai_draft } = req.body;

      const ticket = await prisma.ticket.findUnique({
        where: { uuid: uuid as string },
      });

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      const updatedTicket = await prisma.ticket.update({
        where: { uuid: uuid as string },
        data: {
          ai_draft: ai_draft || ticket.ai_draft,
          status: 'resolved',
        },
      });

      res.json({
        status: 'success',
        message: 'Ticket resolved successfully',
        data: updatedTicket,
      });
    } catch (error) {
      console.error('Resolve ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single ticket
   */
  public async show(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;

      const ticket = await prisma.ticket.findUnique({
        where: { uuid: uuid as string },
        include: {
          category: true,
          created_by: {
            select: {
              uuid: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      res.json({
        status: 'success',
        message: 'Ticket retrieved successfully',
        data: ticket,
      });
    } catch (error) {
      console.error('Show ticket error:', error);
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
      const { title, content, category_id, status } = req.body;

      const ticket = await prisma.ticket.findUnique({
        where: { uuid: uuid as string },
      });

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      const updatedTicket = await prisma.ticket.update({
        where: { uuid: uuid as string },
        data: {
          title,
          content,
          category_id,
          status,
        },
        include: {
          category: true,
        },
      });

      res.json({
        status: 'success',
        message: 'Ticket updated successfully',
        data: updatedTicket,
      });
    } catch (error) {
      console.error('Update ticket error:', error);
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

      const ticket = await prisma.ticket.findUnique({
        where: { uuid: uuid as string },
      });

      if (!ticket) {
        res.status(404).json({
          status: 'error',
          message: 'Ticket not found',
        });
        return;
      }

      await prisma.ticket.delete({
        where: { uuid: uuid as string },
      });

      res.json({
        status: 'success',
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
