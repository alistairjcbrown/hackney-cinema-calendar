const cheerio = require("cheerio");
const { domain } = require("./attributes");

async function retrieve() {
  const movieListPageUrl = `${domain}/calendar/`;
  const movieListPage = await (await fetch(movieListPageUrl)).text();
  const $ = cheerio.load(movieListPage);

  const moviePageUrls = new Set();
  $(".programme-tile").each(function () {
    const url = `${domain}${$(this).find(".tile-details > a").attr("href")}`;
    moviePageUrls.add(url);
  });

  const moviePages = {};
  for (moviePageUrl of [...moviePageUrls]) {
    moviePages[moviePageUrl] = await (await fetch(moviePageUrl)).text();
  }

  return {
    movieListPage,
    moviePages,
  };
}

module.exports = retrieve;
