const cheerio = require("cheerio");
const attributes = require("./attributes");

async function retrieve() {
  const movieListPage = await (await fetch(attributes.url)).text();

  const $ = cheerio.load(movieListPage);
  const moviePageUrls = new Set();
  $(".films-list__by-title__film-title a").each(function () {
    moviePageUrls.add($(this).attr("href"));
  });
  const moviePages = [];
  for (moviePageUrl of moviePageUrls) {
    const moviePage = await (await fetch(moviePageUrl)).text();
    moviePages.push(moviePage);
  }

  return {
    movieListPage,
    moviePages,
  };
}

module.exports = retrieve;
