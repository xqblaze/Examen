import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertRole(name) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function main() {
  const managerRole = await upsertRole('manager');
  await upsertRole('employee');

  const login = process.env.MANAGER_LOGIN;
  const password = process.env.MANAGER_PASSWORD;
  const existing = await prisma.user.findUnique({ where: { login } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        login,
        passwordHash,
        displayName: 'Manager',
        approvedAt: new Date(),
        roleId: managerRole.id
      }
    });
  } else if (!existing.roleId) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { roleId: managerRole.id, approvedAt: existing.approvedAt ?? new Date() }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

