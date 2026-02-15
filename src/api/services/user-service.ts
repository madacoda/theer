import prisma from '../../infra/db';
import bcrypt from 'bcryptjs';

/**
 * UserService
 * Business logic for user operations (Admin)
 */

export interface input {
  page?: number;
  perPage?: number;
  search?: string;
  role_id?: number | null;
}

export class UserService {
  /**
   * List all users with pagination
   */
  public async getAll(input: input = {}) {
    const page = input.page || 1;
    const perPage = input.perPage || 10;
    const search = input.search || '';
    const roleId = input.role_id || null;

    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { roles: { some: { role: { name: { contains: search, mode: 'insensitive' } } } } }
      ];
    }

    if (roleId) {
      where.roles = {
        some: {
          role_id: roleId
        }
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: { role: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.user.count({ where })
    ]);

    return { users, total };
  }

  public async getByUuid(uuid: string) {
    return await prisma.user.findUnique({
      where: { uuid },
      include: {
        roles: {
          include: { role: true }
        }
      },
    });
  }

  public async create(data: any) {
    const { name, email, password, roles } = data;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    return await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Optional: handle roles connection here if needed
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });
  }

  public async update(uuid: string, data: any) {
    const { name, email, password } = data;
    const updateData: any = { name, email };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return await prisma.user.update({
      where: { uuid },
      data: updateData,
      include: {
        roles: {
          include: { role: true }
        }
      }
    });
  }

  public async delete(uuid: string) {
    return await prisma.user.delete({
      where: { uuid },
    });
  }
}
