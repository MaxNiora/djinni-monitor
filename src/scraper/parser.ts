import * as cheerio from "cheerio";

export interface VacancyDTO {
  id: string;
  title: string;
  company: string;
  salary: string | null;
  postedAt: string | null;
  url: string;
}

export function parseVacancyHtml(html: string): VacancyDTO {
  const $ = cheerio.load(html);

  const link   = $("a.job-item__title-link").first();
  const url    = link.attr("href") ?? "";
  const id     = url.match(/(\d+)-/)?.[1] ?? url;

  const company =
    $(".job-item__company-name").text().trim() ||
    $(".job-list-item__company").text().trim() ||
    $("a[data-analytics='company_page']").text().trim() ||
    $("a[href^='/company/']").text().trim();

  const salary =
    $(".public-salary-item").text().trim() ||
    $("span.text-success.text-nowrap").text().trim() ||
    null;

  return {
    id,
    title   : link.text().trim(),
    company,
    salary  : salary || null,
    postedAt: $("time").attr("datetime") ?? null,
    url
  };
}
