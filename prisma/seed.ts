import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await argon2.hash("Admin123!ChangeMe");
  const userPassword = await argon2.hash("User123!ChangeMe");

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: adminPassword, role: Role.ADMIN },
    create: {
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { passwordHash: userPassword, role: Role.USER },
    create: {
      email: "user@example.com",
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  await prisma.item.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        ownerId: admin.id,
        title: "Admin item one",
        description: "Seeded item owned by admin",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        ownerId: user.id,
        title: "User item one",
        description: "Seeded item owned by user",
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        ownerId: user.id,
        title: "User item two",
        description: "Another seeded item for user",
      },
    ],
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
