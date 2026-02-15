import type { Request, Response } from 'express';
import { BaseResource } from '../resources/base-resource';
import { RoleResource } from '../resources/role-resource';
import { RoleService } from '../services/role-service';

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  public async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 10;
      const search = (req.query.search as string) || '';

      const { roles, total } = await this.roleService.getAll(page, perPage, search);

      const meta = BaseResource.paginate(roles, total, page, perPage);
      
      res.json(RoleResource.collection(roles, meta));
    } catch (error) {
      console.error('Role index error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
