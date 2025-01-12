const slugify = require("slugify");
const { format } = require("date-fns");
const { parseMinsToMs } = require("./utils");
const normalizeTitle = require("./normalize-title");
const {
  searchMovieAndCacheResults,
  getMovieInfoAndCacheResults,
} = require("./get-movie-data");

const getMovieTitleAndYearFrom = (title) => {
  const hasYear = title.trim().match(/^(.*?)\s*\((\d{4})\)$/);
  if (hasYear)
    return {
      title: hasYear[1].trim(),
      year: hasYear[2],
    };
  return { title };
};

function getManualMatch(titleQuery) {
  if (titleQuery === "macbeth david tennant & cush jumbo") {
    return require("./manual-overrides/1368487.json");
  }
  return null;
}

function getBestMatch(titleQuery, rawResults) {
  // If there's only one result, then pick it
  if (rawResults.length === 1) return rawResults[0];

  // If there's a few results, remove any which don't have a release date
  const results = rawResults.filter(({ release_date: date }) => !!date);

  // If there's only a few results returned, then pick the first
  if (results.length <= 3) return results[0];

  // If there's only one match that has the same title, then pick it
  const matches = results.filter(
    ({ title, original_title: originalTitle }) =>
      normalizeTitle(title) === titleQuery ||
      normalizeTitle(originalTitle) === titleQuery,
  );

  if (matches.length === 1) return matches[0];

  // Otherwise if there's a bunch which match the title, pick the most popular
  // so long as it's has a decent level of popularity.
  const popularResults = matches
    .filter(({ popularity }) => popularity > 15)
    .sort((a, b) => b.popularity - a.popularity);
  if (popularResults.length > 0) return popularResults[0];

  return undefined;
}

async function hydrate(shows) {
  return await Promise.all(
    shows.map(async (show) => {
      const title = normalizeTitle(show.title, { retainYear: true });
      const { title: normalizedTitle, year } = getMovieTitleAndYearFrom(title);
      const slug = slugify(normalizedTitle, { strict: true }).toLowerCase();
      const search = await searchMovieAndCacheResults({
        normalizedTitle,
        slug,
        year: year || show.overview.year,
      });

      const result =
        getBestMatch(normalizedTitle, search.results) ||
        getManualMatch(normalizedTitle, show);
      if (!result) return show;

      if (!show.overview.duration) {
        const movieInfo = await getMovieInfoAndCacheResults({ id: result.id });
        if (movieInfo.runtime) {
          show.overview.duration = parseMinsToMs(movieInfo.runtime);
        }
      }

      // If the result doesn't have a release date, default it to the date of
      // the first performance.
      const defaultReleaseDate = format(
        new Date(show.performances[0].time),
        "yyyy-MM-dd",
      );
      return {
        ...show,
        moviedb: {
          id: result.id,
          title: result.title,
          releaseDate: result.release_date || defaultReleaseDate,
          summary: result.overview,
        },
      };
    }),
  );
}

module.exports = hydrate;
