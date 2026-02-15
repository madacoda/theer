import prisma from '../../infra/db';
import { enqueueJob, TICKET_QUEUE } from '../../infra/rabbitmq';

/**
 * TicketService
 * Business logic for ticket operations
 */
export class TicketService {
  /**
   * List tickets with role-based filtering and pagination
   */
  public async getAll(userUuid: string, isAdmin: boolean, page: number = 1, perPage: number = 10, filters: any = {}) {
    const skip = (page - 1) * perPage;
    
    const where: any = { AND: [] };

    // Role-based access control
    if (!isAdmin) {
      where.AND.push({ created_by: { uuid: userUuid } });
    }

    // specific filters
    if (filters.urgency) {
      where.AND.push({ urgency: filters.urgency });
    }
    
    if (filters.status) {
      where.AND.push({ status: filters.status });
    }

    if (filters.category) {
      // Assuming passed category is a UUID
      where.AND.push({ category: { uuid: filters.category } });
    }

    // Search functionality
    if (filters.search) {
      where.AND.push({
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } },
          { category: { title: { contains: filters.search, mode: 'insensitive' } } },
          { created_by: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      });
    }

    // If no conditions in AND, remove it to avoid empty AND array issues if Prisma complains (it usually handles it, but empty object is safer)
    // Actually Prisma handles empty AND fine, but let's be cleaner.
    // However, clean up: if AND is empty, just make it empty object? 
    // Simplify:
    const finalWhere = where.AND.length > 0 ? where : {};

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: finalWhere,
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
        skip,
        take: perPage,
      }),
      prisma.ticket.count({ where: finalWhere })
    ]);

    return { tickets, total };
  }

  /**
   * Find a single ticket by UUID with role-based filtering
   */
  public async getByUuid(uuid: string, userUuid: string, isAdmin: boolean) {
    const where: any = { uuid };
    if (!isAdmin) {
      where.created_by = { uuid: userUuid };
    }

    return await prisma.ticket.findFirst({
      where,
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
  }

  /**
   * Create a new ticket
   */
  public async create(data: any, userUuid: string) {
    const { title, content, category_id, status } = data;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        content,
        status: status || 'open',
        category: category_id ? { connect: { id: Number(category_id) } } : undefined,
        created_by: { connect: { uuid: userUuid } },
      },
      include: {
        category: true,
      },
    });

    // Enqueue job for AI triage
    await enqueueJob(TICKET_QUEUE, { ticketId: ticket.id });

    return ticket;
  }

  /**
   * Update a ticket
   */
  public async update(uuid: string, data: any) {
    const { title, content, category_id, status, ai_draft, ai_metadata } = data;

    return await prisma.ticket.update({
      where: { uuid },
      data: {
        title,
        content,
        category_id,
        status,
        ai_draft,
        ai_metadata
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Resolve a ticket
   */
  public async resolve(uuid: string, userUuid: string, ai_draft?: string) {
    return await prisma.ticket.update({
      where: { uuid },
      data: {
        status: 'resolved',
        ai_draft,
        resolved_at: new Date(),
        resolved_by: { connect: { uuid: userUuid } }
      },
      include: {
        category: true,
        resolved_by: {
          select: { name: true, email: true }
        }
      }
    });
  }

  /**
   * Delete a ticket
   */
  public async delete(uuid: string) {
    return await prisma.ticket.delete({
      where: { uuid },
    });
  }
}
