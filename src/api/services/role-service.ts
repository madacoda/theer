import prisma from '../../infra/db';

export class RoleService {
  /**
   * List all roles with pagination and search
   */
  public async getAll(page: number = 1, perPage: number = 10, search: string = '') {
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.role.count({ where })
    ]);

    return { roles, total };
  }
}
