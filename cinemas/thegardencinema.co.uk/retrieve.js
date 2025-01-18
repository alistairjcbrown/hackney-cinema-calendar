const cheerio = require("cheerio");
const attributes = require("./attributes");
const { dailyCache } = require("../../common/cache");

const cacheKeyPrefix = "thegardencinema.co.uk";

async function retrieve() {
  const movieListPage = await dailyCache(`${cacheKeyPrefix}-main`, async () =>
    (await fetch(attributes.url)).text(),
  );

  const $ = cheerio.load(movieListPage);
  const moviePageUrls = new Set();
  $(".films-list__by-title__film-title a").each(function () {
    moviePageUrls.add($(this).attr("href"));
  });
  const moviePages = [];
  for (moviePageUrl of moviePageUrls) {
    const [, urlSegment] = moviePageUrl.split("/film/");
    const slug = urlSegment.replace(/\//g, "");
    const moviePage = await dailyCache(
      `${cacheKeyPrefix}-info-${slug}`,
      async () => (await fetch(moviePageUrl)).text(),
    );
    moviePages.push(moviePage);
  }

  return {
    movieListPage,
    moviePages,
  };
}

module.exports = retrieve;
