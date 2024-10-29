const cheerio = require("cheerio");
const { format, addYears } = require("date-fns");
const { chromium } = require("playwright");
const slugify = require("slugify");
const { dailyCache } = require("../cache");

const dateFormat = "yyyy-MM-dd";

async function getPageWithPlaywright(url, cacheKey, callback) {
  return dailyCache(cacheKey, async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    const result = await callback(page);
    await browser.close();
    return result;
  });
}

async function processSearchResultPage(
  { domain, articleId },
  parsedData,
  html,
) {
  const $ = cheerio.load(html);
  const $showLinks = $(".result-box-item");
  $showLinks.each(function () {
    const $showLink = $(this).find("a.more-info");
    const showUrl = $showLink
      .attr("href")
      .split("&BOparam::WScontent::loadArticle::context_id=")[0];
    parsedData[showUrl] = parsedData[showUrl] || { performances: [] };
    parsedData[showUrl].performances.push($(this).html());
    parsedData[showUrl].title = $showLink.text().trim();
  });

  for (showUrl in parsedData) {
    const showData = parsedData[showUrl];
    if (showData.html) continue;

    const slug = slugify(showData.title, { strict: true }).toLowerCase();
    const cacheKey = `bfi.org.uk-${articleId}-${slug}`;
    parsedData[showUrl].html = await getPageWithPlaywright(
      `${domain}${showUrl}`,
      cacheKey,
      async (page) => {
        await page.waitForLoadState("domcontentloaded");
        await page.getByRole("heading", { level: 1 }).waitFor();
        return await page.content();
      },
    );
  }

  return parsedData;
}

async function retrieve(attributes) {
  const { articleId, url } = attributes;
  const today = new Date();
  const start = format(today, dateFormat);
  const end = format(addYears(today, 1), dateFormat);
  const urlQuery = [
    `doWork%3A%3AWScontent%3A%3Asearch=1`,
    `BOparam%3A%3AWScontent%3A%3Asearch%3A%3Aarticle_search_id=${articleId}`,
    `BOset%3A%3AWScontent%3A%3ASearchCriteria%3A%3Asearch_from=${start}`,
    `BOset%3A%3AWScontent%3A%3ASearchCriteria%3A%3Asearch_to=${end}`,
  ];

  const cacheKey = `bfi.org.uk-${articleId}`;
  const searchResultPages = await getPageWithPlaywright(
    `${url}?${urlQuery.join("&")}`,
    cacheKey,
    async (page) => {
      const pages = [];
      while (true) {
        await page.waitForLoadState("domcontentloaded");
        await page.getByRole("heading", { level: 1 }).waitFor();
        pages.push(await page.content());

        const $nextPageButton = await page.locator("css=#av-next-link");
        if ((await $nextPageButton.count()) > 0) {
          $nextPageButton.click();

          // Wait for the next page to load
          const nextPageNumber = `${pages.length + 1}`;
          await page.waitForURL((url) =>
            url
              .toString()
              .includes(
                `&BOset::WScontent::SearchResultsInfo::current_page=${nextPageNumber}&`,
              ),
          );
          await page.locator(".page-item active", { hasText: nextPageNumber });
        } else {
          // If there's no next page button, we're at the end
          break;
        }
      }
      return pages;
    },
  );

  let parsedData = {};
  for (searchResultPage of searchResultPages) {
    parsedData = await processSearchResultPage(
      attributes,
      parsedData,
      searchResultPage,
    );
  }
  return parsedData;
}

module.exports = retrieve;
