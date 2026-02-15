import type { Request, Response } from 'express';
import prisma from '../../infra/db';
import { UserResource } from '../resources/user-resource';

/**
 * UserController
 * Handles user authentication
 */
export class UserController {
  public async me(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      
      const user = await prisma.user.findUnique({
        where: { uuid: authUser.uuid },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      res.json(UserResource.single(user));
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
}
