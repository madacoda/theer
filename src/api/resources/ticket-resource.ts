import { BaseResource } from './base-resource';
import { UserResource } from './user-resource';
import { TicketCategoryResource } from './ticket-category-resource';

export interface TicketResponse {
  id: number;
  uuid: string;
  title: string;
  content: string | null;
  status: string;
  sentiment_score: number | null;
  urgency: string | null;
  ai_draft: string | null;
  is_ai_triage_failed?: boolean;
  category?: any;
  created_by?: any;
  resolved_by?: any;
  resolved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export class TicketResource extends BaseResource {
  public static transform(ticket: any, isAdmin: boolean = false): TicketResponse {
    const response: TicketResponse = {
      id: ticket.id,
      uuid: ticket.uuid,
      title: ticket.title,
      content: ticket.content,
      status: ticket.status,
      sentiment_score: ticket.sentiment_score,
      urgency: ticket.urgency,
      ai_draft: ticket.ai_draft,
      category: ticket.category ? TicketCategoryResource.transform(ticket.category) : null,
      created_by: ticket.created_by ? UserResource.transform(ticket.created_by) : null,
      resolved_by: ticket.resolved_by ? UserResource.transform(ticket.resolved_by) : null,
      resolved_at: this.formatDateTime(ticket.resolved_at),
      created_at: this.formatDateTime(ticket.created_at),
      updated_at: this.formatDateTime(ticket.updated_at),
    };

    if (isAdmin) {
      response.is_ai_triage_failed = ticket.is_ai_triage_failed ?? (ticket.status === 'failed_triage');
    }

    return response;
  }

  public static single(ticket: any, isAdmin: boolean = false, message: string = 'Ticket retrieved successfully') {
    return this.successResponse(this.transform(ticket, isAdmin), message);
  }

  public static collection(tickets: any[], meta: any, message: string = 'Tickets retrieved successfully', isAdmin: boolean = false) {
    const transformed = tickets.map(ticket => this.transform(ticket, isAdmin));
    return this.successResponse(transformed, message, meta);
  }
}

