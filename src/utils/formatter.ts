/** ************************************************************
 *  Форматування вакансії для Telegram-бота (MarkdownV2)
 * *************************************************************/

import type { Vacancy } from "@prisma/client";

/** Екранування спеціальних символів MarkdownV2 */
export function md(txt: string): string {
  return txt.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

/**
 * Повертає красиво оформлений текст вакансії.
 * @param v         об’єкт Vacancy (з Prisma)
 * @param techIcon  емодзі для стека (🟢 Node, 🔴 Ruby…)
 */
export function formatVacancy(
  v: Vacancy,
  techIcon = "🆕"
): string {
  const salary = v.salary ? `💰 *${md(v.salary)}*` : "💰 —";
  const date   = v.postedAt
    ? `🗓️ ${md(v.postedAt.toISOString().slice(0, 10))}`
    : "";

  return (
    `*${techIcon} ${md(v.title)}*\n` +           // жирний заголовок
    `🏢 _${md(v.company || "Unknown company")}_\n` +
    `${salary}\n${date}`
  );
}
