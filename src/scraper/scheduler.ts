import { prisma } from "../db/client";
import { collectFor } from "./collector";

/**
 * Разово збирає список стеків з активними підписниками
 * та запускає скрапінг для кожного.
 */
async function collectAllStacks() {
  const stacks = await prisma.stack.findMany({
    where: { users: { some: {} } },      // є хоча б 1 підписник
    select: { name: true }
  });

  if (!stacks.length) {
    console.log("[scheduler] немає підписок – пропускаємо цикл");
    return;
  }

  for (const s of stacks) {
    try {
      await collectFor(s.name);
    } catch (e) {
      console.error(`[scheduler] ${s.name} error`, e);
    }
  }
}

/**
 * Включає таймер. Інтервал у хвилинах береться з .env
 * (SCRAPE_INTERVAL_MIN, дефолт 5).
 */
export function scheduleScraping() {
  const min = Number(process.env.SCRAPE_INTERVAL_MIN ?? 5);
  console.log(`[schedule] scrape every ${min} min`);

  // миттєвий запуск
  collectAllStacks().catch(console.error);

  // далі — за таймером
  setInterval(() => {
    collectAllStacks().catch(console.error);
  }, min * 60_000);
}
