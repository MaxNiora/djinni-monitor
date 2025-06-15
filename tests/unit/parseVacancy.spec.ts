import { parseVacancyHtml } from "../../src/scraper/parser";

describe("parseVacancyHtml()", () => {
  it("повертає всі ключові поля вакансії", () => {
    const html = `
      <li id="job-item-123">
        <a class="job-item__title-link" href="/123-nodejs">Middle Node.js Dev</a>
        <a class="js-analytics-event" data-analytics="company_page">Acme</a>
        <span class="text-success text-nowrap">$3200</span>
        <time datetime="2025-06-01T08:00:00Z"></time>
      </li>`;
    const v = parseVacancyHtml(html);

    expect(v).toEqual({
      id      : "123",
      title   : "Middle Node.js Dev",
      company : "Acme",
      salary  : "$3200",
      postedAt: "2025-06-01T08:00:00Z",
      url     : expect.stringContaining("/123-nodejs")
    });
  });
});
