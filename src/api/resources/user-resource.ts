import { BaseResource } from './base-resource';

export interface UserResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  roles: string[];
  created_at: string | null;
  updated_at: string | null;
}

export class UserResource extends BaseResource {
  public static transform(user: any): UserResponse {
    return {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      roles: user.roles?.map((ur: any) => ur.role?.name) || [],
      created_at: this.formatDateTime(user.created_at),
      updated_at: this.formatDateTime(user.updated_at),
    };
  }

  public static single(user: any, message: string = 'User retrieved successfully') {
    return this.successResponse(this.transform(user), message);
  }

  public static collection(users: any[], meta: any, message: string = 'Users retrieved successfully') {
    const transformed = users.map(user => this.transform(user));
    return this.successResponse(transformed, message, meta);
  }
}
