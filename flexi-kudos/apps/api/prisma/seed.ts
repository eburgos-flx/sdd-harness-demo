import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const SEED_MEMBERS = [
  { handle: 'eburgos', full_name: 'Esteban Burgos' },
  { handle: 'gcostabile', full_name: 'Gaston Costabile' },
  { handle: 'mvago', full_name: 'Martin Vago' },
  { handle: 'apresta', full_name: 'Ariel Presta' },
  { handle: 'rda', full_name: 'Romina D Amato' },
  { handle: 'vuribe', full_name: 'Valeria Uribe' },
];

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL'],
  });
  const prisma = new PrismaClient({ adapter });

  for (const member of SEED_MEMBERS) {
    await prisma.member.upsert({
      where: { handle: member.handle },
      update: {},
      create: { handle: member.handle, full_name: member.full_name },
    });
  }

  const count = await prisma.member.count();
  console.log(`[seed] members seeded (idempotent). total = ${count}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
