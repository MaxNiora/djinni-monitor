import { prisma } from "../db/client";
import { collectFor } from "./collector";

export async function collectAllStacks() {
  const stacks = await prisma.stack.findMany({
    where: { users: { some: {} } },       // є підписники
    select: { name: true }
  });

  for (const s of stacks) {
    await collectFor(s.name);
  }
}
