export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export class BaseResource {
  public static formatDateTime(dateInput: Date | string | null | undefined): string | null {
    if (!dateInput) return null;
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) return null;
    
    // Format: 06 Feb 2026 04:23
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  public static paginate(data: any[], total: number, page: number, perPage: number, path: string = '') {
    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, total);

    return {
      current_page: page,
      from,
      last_page: lastPage,
      path,
      per_page: perPage,
      to,
      total
    };
  }

  protected static successResponse(data: any, message: string, meta?: PaginationMeta) {
    return {
      data,
      ...(meta && { meta }),
      status: 'success',
      message
    };
  }
}
