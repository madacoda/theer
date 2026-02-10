import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users
  console.log('--- Seeding Users ---');
  const hashedPassword = await bcrypt.hash('Password123', 10);
  
  const initialUsers = [
    {
      name: 'System Admin',
      email: 'admin@mc-theer.com',
      password: hashedPassword,
    },
    {
      name: 'Regular User',
      email: 'user@mc-theer.com',
      password: hashedPassword,
    },
  ];

  for (const userData of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`User ready: ${user.email}`);
  }

  // 2. Seed Ticket Categories
  console.log('--- Seeding Ticket Categories ---');
  const categories = [
    { title: 'Technical Support', description: 'Hardware and software issues' },
    { title: 'Billing', description: 'Invoices, payments and subscriptions' },
    { title: 'Feature Request', description: 'Suggest new ideas' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    let category = await prisma.ticketCategory.findFirst({
      where: { title: cat.title },
    });

    if (!category) {
      category = await prisma.ticketCategory.create({
        data: cat,
      });
      console.log(`Created category: ${category.title}`);
    } else {
      console.log(`Category already exists: ${category.title}`);
    }
    createdCategories.push(category);
  }

  // 3. Seed Roles
  console.log('--- Seeding Roles ---');
  const roles = [
    { name: 'admin', description: 'Administrator role' },
    { name: 'user', description: 'Regular user role' },
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    let role = await prisma.role.findFirst({
      where: { name: roleData.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: roleData,
      });
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
    createdRoles.push(role);
  }

  // 4. Seed User Roles
  console.log('--- Seeding User Roles ---');
  const allUsers = await prisma.user.findMany();
  const adminUser = allUsers.find(u => u.email === 'admin@mc-theer.com');
  const regularUser = allUsers.find(u => u.email === 'user@mc-theer.com');
  const adminRole = createdRoles.find(r => r.name === 'admin');
  const userRole = createdRoles.find(r => r.name === 'user');

  if (adminUser && adminRole) {
    await prisma.userRole.upsert({
      where: { 
        user_id_role_id: { 
          user_id: adminUser.id, 
          role_id: adminRole.id 
        } 
      },
      update: {},
      create: { 
        user_id: adminUser.id, 
        role_id: adminRole.id 
      },
    });
    console.log(`Assigned admin role to admin user`);
  }

  if (regularUser && userRole) {
    await prisma.userRole.upsert({
      where: { 
        user_id_role_id: { 
          user_id: regularUser.id, 
          role_id: userRole.id 
        } 
      },
      update: {},
      create: { 
        user_id: regularUser.id, 
        role_id: userRole.id 
      },
    });
    console.log(`Assigned user role to regular user`);
  }

  // 5. Seed Tickets
  console.log('--- Seeding Tickets ---');
  const ticketsData = [
    {
      title: 'Cannot login to my account',
      content: 'I keep getting an invalid credentials error even though my password is correct.',
      category_id: createdCategories[0]!.id,
      status: 'open',
      created_by_id: adminUser?.id,
    },
    {
      title: 'Payment failed yesterday',
      content: 'My credit card was declined but I was charged anyway.',
      category_id: createdCategories[1]!.id,
      status: 'processed',
      created_by_id: regularUser?.id,
    },
    {
      title: 'Dark mode request',
      content: 'Please add dark mode to the dashboard, it is too bright!',
      category_id: createdCategories[2]!.id,
      status: 'resolved',
      created_by_id: regularUser?.id,
    },
  ];

  for (const ticketData of ticketsData) {
    const existingTicket = await prisma.ticket.findFirst({
      where: { title: ticketData.title },
    });

    if (!existingTicket) {
      const ticket = await prisma.ticket.create({
        data: ticketData,
      });
      console.log(`Created ticket: ${ticket.title}`);
    } else {
      console.log(`Ticket already exists: ${ticketData.title}`);
    }
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
