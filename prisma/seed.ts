import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PROJECTS = [
  { name: 'WorkWear', label: 'WorkWear', color: 'blue', order: 0 },
  { name: 'CMLine', label: 'CMLine', color: 'violet', order: 1 },
  { name: 'PERUFLORES', label: 'PERUFLORES', color: 'pink', order: 2 },
  { name: 'MACHUPICCHU', label: 'MACHUPICCHU', color: 'amber', order: 3 },
  { name: 'TODO SERVICIOS', label: 'TODO SERVICIOS', color: 'slate', order: 4 },
];

async function main() {
  for (const project of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { name: project.name },
      update: {},
      create: project,
    });
  }

  console.log(`Seeded ${DEFAULT_PROJECTS.length} default projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
