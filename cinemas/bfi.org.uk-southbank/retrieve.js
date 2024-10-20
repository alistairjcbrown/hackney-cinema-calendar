const { chromium } = require("playwright");

async function retrieve(
  url = "https://whatson.bfi.org.uk/Online/default.asp?BOparam::WScontent::loadArticle::permalink=filmsindex",
) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForLoadState("domcontentloaded");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const html = await page.content();
  await browser.close();
  return html;
}

module.exports = retrieve;
