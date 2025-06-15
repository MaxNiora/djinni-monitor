/* eslint-disable no-console */
import puppeteer from "puppeteer";
import { prisma } from "../db/client";
import { bot }    from "../bot";
import type { Vacancy } from "@prisma/client";
import type { InlineKeyboardButton } from "node-telegram-bot-api";

import { parseVacancyHtml } from "./parser";
import { formatVacancy }    from "../utils/formatter";

/* ───────────────────────────────────────────────────────────── */

export async function collectFor(stack: string): Promise<void> {
  console.log(`[scraper] ▶ ${stack}`);

  /* ───── 1. Puppeteer ─────────────────────────────────────── */
  const browser = await puppeteer.launch({
    headless: process.env.PUPPETEER_HEADLESS !== "false",
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  const url =
    "https://djinni.co/jobs/?primary_keyword=" +
    encodeURIComponent(stack);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
  await page.waitForSelector("li[id^='job-item-']", { timeout: 30_000 });

  /* ───── 2. HTML кожної вакансії ──────────────────────────── */
  const rawHtmlRows: string[] = await page.$$eval(
    "li[id^='job-item-']",
    (nodes) => nodes.map((n) => (n as HTMLElement).outerHTML)
  );

  await browser.close();
  if (!rawHtmlRows.length) {
    console.log(`[scraper] ${stack}: 0 rows — пропущено`);
    return;
  }

  /* ───── 3. Парсимо → DTO, конвертуємо дату ──────────────── */
  const rows = rawHtmlRows.map((h) => {
    const dto = parseVacancyHtml(h);
    return { ...dto, postedAt: dto.postedAt ? new Date(dto.postedAt) : new Date() };
  });

  /* ───── 4. Гарантуємо тег у таблиці Stack ───────────────── */
  const tag = await prisma.stack.upsert({
    where : { name: stack },
    create: { name: stack },
    update: {}
  });

  /* ───── 5. UPSERT + збір «fresh» ────────────────────────── */
  const fresh: Vacancy[] = [];

  for (const v of rows) {
    const exists = await prisma.vacancy.findUnique({
      where:  { id: v.id },
      select: { id: true }
    });
    if (exists) continue;

    const rec = await prisma.vacancy.create({
      data: {
        id: v.id,
        title: v.title,
        company: v.company,
        salary: v.salary,
        postedAt: v.postedAt as Date,
        url: v.url,
        stacks: { connect: { id: tag.id } }
      }
    });
    fresh.push(rec);
  }

  console.log(`[scraper] ${stack}: new = ${fresh.length}`);
  if (!fresh.length) return;

  /* ───── 6. Розсилка ─────────────────────────────────────── */
  type ChatOnly = { chatId: bigint };

  const subscribers: ChatOnly[] = await prisma.user.findMany({
    where : { stacks: { some: { id: tag.id } } },
    select: { chatId: true }
  });
  if (!subscribers.length) return;

  const techIcon = "🟢";      

  for (const vac of fresh) {
    const text = formatVacancy(vac, techIcon);

    const fullUrl = vac.url.startsWith("http")
  ? vac.url
  : `https://djinni.co${vac.url}`;

const keyboard = {
  inline_keyboard: [[ { text: "📄 Детальніше", url: fullUrl } ]]
};

    for (const { chatId } of subscribers) {
      await bot.sendMessage(Number(chatId), text, {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
        disable_web_page_preview: false
      });
      await delay(100);
    }
  }
}

/* ───── helpers ───────────────────────────────────────────── */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
