import { BaseResource } from './base-resource';

export interface RoleResponse {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
}

export class RoleResource extends BaseResource {
  public static transform(role: any): RoleResponse {
    return {
      id: role.id,
      uuid: role.uuid,
      name: role.name,
      description: role.description,
    };
  }

  public static single(role: any, message: string = 'Role retrieved successfully') {
    return this.successResponse(this.transform(role), message);
  }

  public static collection(roles: any[], meta: any, message: string = 'Roles retrieved successfully') {
    const transformed = roles.map(role => this.transform(role));
    return this.successResponse(transformed, message, meta);
  }
}
