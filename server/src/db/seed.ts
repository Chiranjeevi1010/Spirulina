import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema/index.js';
import { ROLE_PERMISSIONS, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '@spirulina/shared';
import type { UserRole } from '@spirulina/shared';
import bcrypt from 'bcryptjs';

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Seeding database...');

  // Seed roles
  const roleNames: UserRole[] = ['admin', 'manager', 'lab_technician', 'sales_team'];
  for (const roleName of roleNames) {
    await db.insert(schema.roles).values({
      name: roleName,
      displayName: ROLE_DISPLAY_NAMES[roleName],
      description: ROLE_DESCRIPTIONS[roleName],
      permissions: ROLE_PERMISSIONS[roleName],
      isSystem: true,
    }).onConflictDoNothing();
  }
  console.log('Roles seeded');

  // Get admin role
  const [adminRole] = await db.select().from(schema.roles).where(
    eq(schema.roles.name, 'admin')
  ).limit(1);

  // Seed admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await db.insert(schema.users).values({
    email: 'admin@spirulina.com',
    passwordHash,
    firstName: 'System',
    lastName: 'Admin',
    roleId: adminRole.id,
    isActive: true,
  }).onConflictDoNothing();
  console.log('Admin user seeded (admin@spirulina.com / Admin@123)');

  // Seed expense categories
  const categories = ['Electricity', 'Labor', 'Chemicals', 'Water', 'Maintenance', 'Packaging', 'Transport'];
  for (const cat of categories) {
    await db.insert(schema.expenseCategories).values({ name: cat }).onConflictDoNothing();
  }
  console.log('Expense categories seeded');

  // Seed default settings
  const defaultSettings = [
    { category: 'ai', key: 'provider', value: 'claude', description: 'Active AI provider' },
    { category: 'ai', key: 'model', value: 'claude-sonnet-4-20250514', description: 'AI model to use' },
    { category: 'ai', key: 'claude_api_key', value: '', description: 'Claude API key' },
    { category: 'ai', key: 'openai_api_key', value: '', description: 'OpenAI API key' },
    { category: 'alerts', key: 'hardness_critical', value: 3000, description: 'Hardness critical threshold' },
    { category: 'alerts', key: 'do_warning', value: 5, description: 'DO warning threshold' },
    { category: 'alerts', key: 'do_critical', value: 3, description: 'DO critical threshold' },
    { category: 'alerts', key: 'mg_optimal_min', value: 250, description: 'Mg optimal min ppm' },
    { category: 'alerts', key: 'mg_optimal_max', value: 300, description: 'Mg optimal max ppm' },
  ];
  for (const s of defaultSettings) {
    await db.insert(schema.settings).values(s).onConflictDoNothing();
  }
  console.log('Default settings seeded');

  await pool.end();
  console.log('Seeding complete!');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
