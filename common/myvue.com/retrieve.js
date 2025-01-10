const { chromium } = require("playwright-extra");

require("dotenv").config();

const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

const connectionURL = `wss://browser.zenrows.com?apikey=${process.env.ZENROWS_API_KEY}&proxy_country=gb`;

async function retrieve({ domain, url, cinemaId }) {
  const browser = await chromium.connectOverCDP(connectionURL);
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForLoadState();
  await page.locator(".header__box").waitFor();
  const result = await page.evaluate(
    (url) => fetch(url).then((response) => response.json()),
    `${domain}/api/microservice/showings/cinemas/${cinemaId}/films`,
  );
  await browser.close();
  return result;
}

module.exports = retrieve;
