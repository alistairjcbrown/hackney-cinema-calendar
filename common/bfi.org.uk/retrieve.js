const cheerio = require("cheerio");
const { format, addYears } = require("date-fns");
const { chromium } = require("playwright-extra");
const slugify = require("slugify");
const { dailyCache } = require("../cache");

const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

const dateFormat = "yyyy-MM-dd";

async function getPageWithPlaywright(url, cacheKey, callback) {
  return dailyCache(cacheKey, async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url);
      const result = await callback(page);
      await browser.close();
      return result;
    } catch (error) {
      await page.screenshot({
        path: `./playwright-failures/error--${cacheKey}.png`,
      });
      throw error;
    }
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
        // Wait until the page is finished everything
        await page.waitForLoadState("networkidle");
        // Make sure there's information showing. Not all pages have film info
        // (that we care about), so check for the rich text or media areas too
        try {
          await page
            .locator(".Film-info__information,.Rich-text,.Media")
            .waitFor({ strict: false });
        } catch (error) {
          console.error(`Page data not available at ${domain}${showUrl}`);
          throw error;
        }

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
        // Wait until the page is finished everything
        await page.waitForLoadState("networkidle");
        // Make sure there's results showing
        await page.locator(".detailed-search-results").waitFor();
        // Make sure there's pagination available (this will break if BFI ever only has 1 page of results)
        await page.locator(".pagination-box").waitFor();

        pages.push(await page.content());

        const $nextPageButton = await page.locator("css=#av-next-link");
        if ((await $nextPageButton.count()) > 0) {
          $nextPageButton.click();

          // Wait for the next page to load
          const nextPageNumber = `${pages.length + 1}`;
          // Wait for the URL to change
          await page.waitForURL((url) =>
            url
              .toString()
              .includes(
                `&BOset::WScontent::SearchResultsInfo::current_page=${nextPageNumber}&`,
              ),
          );
          // Wait for the pagination to update
          await page
            .locator(".av-paging-links.active", { hasText: nextPageNumber })
            .waitFor();
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
