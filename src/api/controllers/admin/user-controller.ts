import type { Request, Response } from 'express';
import { UserService } from '../../services/user-service';
import { UserResource } from '../../resources/user-resource';

/**
 * UserController
 * Handles user management for admins
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * List all users with pagination
   */
  public async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const search = (req.query.search as string) || '';
      const role_id = req.query.role_id ? parseInt(req.query.role_id as string) : null;
      
      const { users, total } = await this.userService.getAll({
        page,
        perPage,
        search,
        role_id
      });
      
      const path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const meta = UserResource.paginate(users, total, page, perPage, path);

      res.json(UserResource.collection(users, meta, 'Users retrieved successfully'));
    } catch (error) {
      console.error('Admin Index users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create a new user
   */
  public async store(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.create(req.body);

      res.status(201).json(UserResource.single(user, 'User created successfully'));
    } catch (error) {
      console.error('Admin Store user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get a single user
   */
  public async find(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const user = await this.userService.getByUuid(uuid as string);

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      res.json(UserResource.single(user));
    } catch (error) {
      console.error('Admin Show user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update a user
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      const updatedUser = await this.userService.update(uuid as string, req.body);

      res.json(UserResource.single(updatedUser, 'User updated successfully'));
    } catch (error) {
      console.error('Admin Update user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete a user
   */
  public async destroy(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params;
      await this.userService.delete(uuid as string);

      res.json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Admin Delete user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
