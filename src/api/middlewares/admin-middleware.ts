import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth-middleware';
import prisma from '../../infra/db';

/**
 * adminMiddleware
 * Restricts access to admin-only routes.
 * If user is not an admin, returns a 404 Not Found (per user requirement).
 */
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userPayload = req.user;

    if (!userPayload) {
      res.status(404).send('Not Found'); // Or redirect/error
      return;
    }

    // Check if user has the admin role in the database
    const userWithRoles = await prisma.user.findUnique({
      where: { uuid: userPayload.uuid },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const isAdmin = userWithRoles?.roles.some((ur: any) => ur.role.name === 'admin');

    if (!isAdmin) {
      // User is not an admin, return 404 as requested
      res.status(404).send('Not Found');
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(404).send('Not Found');
  }
};
