const cheerio = require("cheerio");
const { MovieDb } = require("moviedb-promise");
const { dailyCache } = require("../common/cache");
const slugify = require("slugify");
require("dotenv").config();

const moviedb = new MovieDb(process.env.MOVIEDB_API_KEY);
const url =
  "https://editorial.rottentomatoes.com/guide/best-movies-of-all-time/";

(async function () {
  const sanitize = (value) =>
    value
      .toLowerCase()
      .replace(/[.,!\-:·]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  // console.log("Requesting list...")
  const response = await dailyCache(
    `rottentomatoes-best-movies-of-all-time`,
    async () => (await fetch(url)).text(),
  );
  const $ = cheerio.load(response);
  const movies = [];
  $("p.movie").each(function () {
    movies.push({
      title: $(this).find("a.title").text().trim(),
      year: $(this).find("span.year").text().trim().replace(/[(|)]/g, ""),
    });
  });

  const matchIds = [];
  for (const { title, year } of movies) {
    const slug = slugify(title);
    // console.log("Requesting", title);
    let response = await dailyCache(
      `moviedb-search-related-year-${year}-${slug}`,
      async () => moviedb.searchMovie({ query: title, year }),
    );
    if (response.results.length === 0) {
      response = await dailyCache(
        `moviedb-search-related-added-year-${year}-${slug}`,
        async () => moviedb.searchMovie({ query: title, year: year + 1 }),
      );
    }

    const { results } = response;

    if (results.length === 0) {
      console.log("Not found", title, results);
      throw new Error("Match Not Found");
    }

    if (results.length === 1) {
      matchIds.push(results[0].id);
      continue;
    }

    const exactMatches = results.filter(
      ({ title: resultTitle, release_date: date }) => {
        const isSameTitle = sanitize(resultTitle) === sanitize(title);
        const isSameYear =
          date.split("-")[0] === year ||
          date.split("-")[0] === `${parseInt(year, 10) + 1}`;
        return isSameTitle && isSameYear;
      },
    );

    if (exactMatches.length === 1) {
      matchIds.push(exactMatches[0].id);
      continue;
    }

    if (exactMatches.length > 1) {
      matchIds.push(exactMatches[0].id);
      continue;
    }

    matchIds.push(results[0].id);
  }

  console.log(matchIds.join(","));
})();
