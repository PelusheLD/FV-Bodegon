import 'dotenv/config';
import { db } from './db';
import { adminUsers, siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  const existingAdmin = await db.select().from(adminUsers).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(adminUsers).values({
      username: 'admin',
      email: 'admin@fvbodegones.com',
      password: 'admin123',
      role: 'superadmin',
    });
    console.log('✓ Created default admin user (username: admin, password: admin123)');
  } else {
    console.log('✓ Admin user already exists');
  }

  const existingSettings = await db.select().from(siteSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(siteSettings).values({
      siteName: 'FV BODEGONES',
      siteDescription: 'Tu bodega de confianza para productos de consumo diario',
      contactPhone: '+1 (555) 123-4567',
      contactEmail: 'contacto@fvbodegones.com',
      contactAddress: 'Calle Principal #123, Ciudad',
      facebookUrl: '#',
      instagramUrl: '#',
      twitterUrl: '#',
    });
    console.log('✓ Created default site settings');
  } else {
    console.log('✓ Site settings already exist');
  }

  console.log('Database seeding completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
