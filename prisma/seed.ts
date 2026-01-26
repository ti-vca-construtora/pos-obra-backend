import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@admin.com';

  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminExists) {
    console.log(' Admin já existe');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      nome: 'Administrador',
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('🚀 Admin criado com sucesso');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao rodar seed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
