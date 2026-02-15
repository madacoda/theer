import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

async function main() {
  console.log('🌱 Starting database seeding using PG direct driver...');

  const client = await pool.connect();
  try {
    // 1. Seed Roles
    console.log('--- Seeding Roles ---');
    await client.query(`
      INSERT INTO roles (id, uuid, name, description) 
      VALUES (1, gen_random_uuid(), 'admin', 'Administrator role')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
    `);
    await client.query(`
      INSERT INTO roles (id, uuid, name, description) 
      VALUES (2, gen_random_uuid(), 'user', 'Regular user role')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
    `);
    
    // 2. Seed Users
    console.log('--- Seeding Users ---');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const madacodaPassword = await bcrypt.hash('Madacoda1', 10);

    const users = [
      { name: 'Madacoda Admin', email: 'me@madacoda.dev', password: madacodaPassword },
      { name: 'System Admin', email: 'admin@mc-theer.com', password: hashedPassword },
      { name: 'Regular User', email: 'user@mc-theer.com', password: hashedPassword },
    ];

    for (const u of users) {
      await client.query(
        'INSERT INTO users (uuid, name, email, password, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()',
        [u.name, u.email, u.password]
      );
    }

    // 3. Assign Roles
    console.log('--- Assigning Roles ---');
    // Admin role to me@madacoda.dev
    await client.query(`
      INSERT INTO user_roles (uuid, user_id, role_id, updated_at)
      SELECT gen_random_uuid(), u.id, 1, NOW()
      FROM users u WHERE u.email = 'me@madacoda.dev'
      ON CONFLICT (user_id, role_id) DO NOTHING
    `);

    // Admin role to admin@mc-theer.com
    await client.query(`
      INSERT INTO user_roles (uuid, user_id, role_id, updated_at)
      SELECT gen_random_uuid(), u.id, 1, NOW()
      FROM users u WHERE u.email = 'admin@mc-theer.com'
      ON CONFLICT (user_id, role_id) DO NOTHING
    `);

    // User role to user@mc-theer.com
    await client.query(`
      INSERT INTO user_roles (uuid, user_id, role_id, updated_at)
      SELECT gen_random_uuid(), u.id, 2, NOW()
      FROM users u WHERE u.email = 'user@mc-theer.com'
      ON CONFLICT (user_id, role_id) DO NOTHING
    `);

    // 4. Seed Categories
    console.log('--- Seeding Categories ---');
    const categories = [
      'Technical Support',
      'Billing',
      'Feature Request'
    ];
    for (const cat of categories) {
      const res = await client.query('SELECT id FROM ticket_categories WHERE title = $1', [cat]);
      if (res.rowCount === 0) {
        await client.query('INSERT INTO ticket_categories (uuid, title, updated_at) VALUES (gen_random_uuid(), $1, NOW())', [cat]);
      }
    }

    console.log('✅ Seeding completed successfully!');
  } finally {
    client.release();
  }
}

main().catch(console.error).finally(() => pool.end());
