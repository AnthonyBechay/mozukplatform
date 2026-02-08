const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@mozuk.net' } });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
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
