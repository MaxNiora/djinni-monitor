import puppeteer from "puppeteer";
import { prisma } from "../db/client";
import { bot }    from "../bot";
import type { Vacancy, User } from "@prisma/client";

/**
 * Збирає вакансії для одного стеку (keyword), зберігає їх у БД
 * і надсилає повідомлення лише підписаним користувачам.
 */
export async function collectFor(stack: string): Promise<void> {
  console.log(`[scraper] ▶ ${stack}`);

  /* ───── 1. Puppeteer ─────────────────────────────────── */
  const browser = await puppeteer.launch({
    headless: process.env.PUPPETEER_HEADLESS !== "false",
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"]
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  const url = `https://djinni.co/jobs/?primary_keyword=${encodeURIComponent(stack)}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
  await page.waitForSelector("li[id^='job-item-']", { timeout: 30_000 });

  /* ───── 2. Парсимо DOM ───────────────────────────────── */
  const rawRows = await page.$$eval("li[id^='job-item-']", (nodes) =>
    nodes.map((n) => {
      const linkEl  = n.querySelector("a.job-item__title-link") as HTMLAnchorElement;
      const url     = linkEl?.href ?? "";
      const idMatch = url.match(/(\d+)-/);

      /* company */
      const company =
        (n.querySelector(".job-item__company-name")?.textContent ??
         n.querySelector(".job-list-item__company")?.textContent ??
         n.querySelector("a.js-analytics-event[data-analytics='company_page']")?.textContent ??
         n.querySelector("a[href^='/company/']")?.textContent ?? "")
        .trim();

      /* salary */
      const salary =
        (n.querySelector(".public-salary-item")?.textContent ??
         n.querySelector("span.text-success.text-nowrap")?.textContent ?? "")
        .trim() || null;

      /* date */
      const dateISO = n.querySelector("time")?.getAttribute("datetime") ?? null;

      return {
        id:       idMatch ? idMatch[1] : url,
        title:    linkEl?.textContent?.trim() ?? "",
        company,
        salary,
        postedAt: dateISO,
        url
      };
    })
  );

  await browser.close();
  if (!rawRows.length) {
    console.log(`[scraper] ${stack}: 0 rows — пропускаємо`);
    return;
  }

  /* ───── 3. Конвертуємо дату, upsert, визначаємо «свіжі» ─ */
  const rows = rawRows.map((r) => ({
    ...r,
    postedAt: r.postedAt ? new Date(r.postedAt) : new Date()
  }));

  const tag = await prisma.stack.upsert({
    where:  { name: stack },
    create: { name: stack },
    update: {}
  });

  const fresh: Vacancy[] = [];

  for (const v of rows) {
    const exists = await prisma.vacancy.findUnique({
      where: { id: v.id },
      select: { id: true }
    });
    if (exists) continue;                      // уже є в БД

    const rec = await prisma.vacancy.create({
      data: {
        ...v,
        stacks: { connect: { id: tag.id } }
      }
    });
    fresh.push(rec);
  }

  console.log(`[scraper] ${stack}: new = ${fresh.length}`);

  /* ───── 4. Розсилка підписникам ───────────────────────── */
  if (!fresh.length) return;

  const subscribers: User[] = await prisma.user.findMany({
    where: { stacks: { some: { id: tag.id } } },
    select: { chatId: true }
  });

  if (!subscribers.length) return;

  for (const vac of fresh) {
    const text = formatVacancy(vac);
    for (const u of subscribers) {
      await bot.sendMessage(Number(u.chatId), text, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true
      });
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

/* ───── helper ───── */
function md(text: string) {
  return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

function formatVacancy(v: Vacancy): string {
  return (
    `*🆕 ${md(v.title)}*\n` +
    `${md(v.company || "Unknown company")}\n` +
    `${v.salary ? md(v.salary) : "—"}\n` +
    `[Відкрити](${v.url})`
  );
}
