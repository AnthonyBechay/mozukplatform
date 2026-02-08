import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@mozuk.net' },
    update: {},
    create: {
      email: 'admin@mozuk.net',
      password: hashedPassword,
      name: 'Admin',
    },
  });

  console.log('Seed complete: admin@mozuk.net / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
