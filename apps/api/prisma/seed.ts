/**
 * Local-mode seed — creates a single implicit user so the API works
 * out of the box with CAREER_OPS_AUTH=none (no sign-in required).
 *
 * Safe to re-run: upserts on the fixed local-user ID.
 * In cloud mode this seed is never executed in production.
 */
import { PrismaClient, SpendTier } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed ID used by local-mode auth middleware to resolve the implicit user.
// Must match LOCAL_USER_ID in src/config/env.ts.
const LOCAL_USER_ID = "local_user_00000000000";

async function main() {
  const user = await prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      email: "local@career-ops.local",
      name: "Local User",
      settings: {
        create: {
          spendTier: SpendTier.STANDARD,
          outputLanguage: "en",
          cvOutputFormat: "html",
          autoPdfScoreThreshold: 3.0,
        },
      },
    },
  });

  console.log(`✓ Local user seeded: ${user.id} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
