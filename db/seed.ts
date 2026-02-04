import 'dotenv/config';
import { db } from './index';
import { templates } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Templates 데이터
  console.log('📋 Seeding templates...');

  const templateData = [
    {
      id: 'classic',
      name: 'Classic',
      category: 'CLASSIC' as const,
      tier: 'FREE' as const,
      thumbnail: '/templates/classic.png',
      config: JSON.stringify({
        colors: {
          primary: '#d946ef',
          secondary: '#f9a8d4',
        },
        fonts: {
          heading: 'serif',
          body: 'sans-serif',
        },
      }),
      isActive: true,
    },
    {
      id: 'modern',
      name: 'Modern',
      category: 'MODERN' as const,
      tier: 'FREE' as const,
      thumbnail: '/templates/modern.png',
      config: JSON.stringify({
        colors: {
          primary: '#3b82f6',
          secondary: '#93c5fd',
        },
        fonts: {
          heading: 'sans-serif',
          body: 'sans-serif',
        },
      }),
      isActive: true,
    },
    {
      id: 'vintage',
      name: 'Vintage',
      category: 'VINTAGE' as const,
      tier: 'PREMIUM' as const,
      thumbnail: '/templates/vintage.png',
      config: JSON.stringify({
        colors: {
          primary: '#92400e',
          secondary: '#fde68a',
        },
        fonts: {
          heading: 'serif',
          body: 'serif',
        },
      }),
      isActive: true,
    },
  ];

  for (const template of templateData) {
    await db
      .insert(templates)
      .values(template)
      .onConflictDoNothing()
      .execute();

    console.log(`  ✓ ${template.name} template`);
  }

  console.log('✅ Seeding completed!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
