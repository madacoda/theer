import { BaseResource } from './base-resource';

export interface TicketCategoryResponse {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export class TicketCategoryResource extends BaseResource {
  public static transform(category: any): TicketCategoryResponse {
    return {
      id: category.id,
      uuid: category.uuid,
      title: category.title,
      description: category.description,
      created_at: this.formatDateTime(category.created_at),
      updated_at: this.formatDateTime(category.updated_at),
    };
  }

  public static single(category: any, message: string = 'Ticket category retrieved successfully') {
    return this.successResponse(this.transform(category), message);
  }

  public static collection(categories: any[], meta: any, message: string = 'Data retrieved successfully') {
    const transformed = categories.map(cat => this.transform(cat));
    return this.successResponse(transformed, message, meta);
  }
}
