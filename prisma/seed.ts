import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Roles
  console.log('--- Seeding Roles ---');
  const roles = [
    { id: 1, name: 'admin', description: 'Administrator role' },
    { id: 2, name: 'user', description: 'User role' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { id: roleData.id },
      update: { name: roleData.name, description: roleData.description },
      create: roleData,
    });
    console.log(`Role ready: ${roleData.name}`);
  }

  // 2. Seed Users
  console.log('--- Seeding Users ---');
  const hashedPassword = await bcrypt.hash('Password123', 10);
  
  const users = [
    {
      name: 'Madacoda Admin',
      email: 'me@madacoda.dev',
      password: hashedPassword,
    },
    {
      name: 'Regular User',
      email: 'user@madacoda.dev',
      password: hashedPassword,
    },
    {
      name: 'Ananta',
      email: 'ananta@madacoda.dev',
      password: hashedPassword,
    },
    {
      name: 'Burhanuddin',
      email: 'burhanuddin@madacoda.dev',
      password: hashedPassword,
    },
  ];

  const seededUsers: any[] = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { password: userData.password },
      create: userData,
    });
    console.log(`User ready: ${user.email}`);
    seededUsers.push(user);
  }

  // 3. Assign Roles
  console.log('--- Assigning Roles ---');
  const adminUser = seededUsers.find(u => u.email === 'me@madacoda.dev');
  const systemAdmin = seededUsers.find(u => u.email === 'admin@mc-theer.com');
  const regularUser = seededUsers.find(u => u.email === 'user@mc-theer.com');

  if (adminUser) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: adminUser.id, role_id: 1 } },
      update: {},
      create: { user_id: adminUser.id, role_id: 1 },
    });
    console.log(`Assigned admin role to ${adminUser.email}`);
  }

  if (systemAdmin) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: systemAdmin.id, role_id: 1 } },
      update: {},
      create: { user_id: systemAdmin.id, role_id: 1 },
    });
  }

  if (regularUser) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: regularUser.id, role_id: 2 } },
      update: {},
      create: { user_id: regularUser.id, role_id: 2 },
    });
    console.log(`Assigned user role to ${regularUser.email}`);
  }

  // 4. Seed Ticket Categories
  console.log('--- Seeding Ticket Categories ---');
  const categories = [
    { id: 1, title: 'Technical Support', description: 'Hardware and software issues' },
    { id: 2, title: 'Billing', description: 'Invoices, payments and subscriptions' },
    { id: 3, title: 'Feature Request', description: 'Suggest new ideas' },
  ];

  for (const cat of categories) {
    await prisma.ticketCategory.upsert({
      where: { id: cat.id },
      update: { 
        title: cat.title,
        description: cat.description 
      },
      create: cat,
    });
    console.log(`Category ready: ${cat.title}`);
  }

  // 5. Reset Sequences (Required when inserting explicit IDs in Postgres)
  console.log('--- Resetting Sequences ---');
  const tables = ['roles', 'users', 'ticket_categories', 'tickets', 'user_roles'];
  for (const table of tables) {
    const seqName = `${table}_id_seq`;
    await prisma.$executeRawUnsafe(`
      SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT MAX(id) FROM ${table}) IS NOT NULL);
    `);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
