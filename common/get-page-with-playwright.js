const { chromium } = require("playwright-extra");
const { dailyCache } = require("./cache");

const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

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
      try {
        await page.screenshot({
          path: `./playwright-failures/error--${cacheKey}.png`,
        });
      } catch (screenshotError) {
        console.log("Unable to take error screenshot:", screenshotError);
      }
      throw error;
    }
  });
}

module.exports = getPageWithPlaywright;
