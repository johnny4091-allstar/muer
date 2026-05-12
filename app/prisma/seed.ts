import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.reseller.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existing) {
    console.log("Admin account already exists — skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("changeme", 12);

  const reseller = await prisma.reseller.create({
    data: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin",
      tier: "ENTERPRISE",
    },
  });

  await prisma.fleetSettings.create({
    data: { resellerId: reseller.id },
  });

  await prisma.versionConfig.create({
    data: { resellerId: reseller.id },
  });

  console.log("✓ Admin account created: admin@example.com / changeme");
  console.log("  ⚠  Change this password immediately after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
