const slugify = require("slugify");
const { MovieDb } = require("moviedb-promise");
const { dailyCache } = require("./cache");
const { parseMinsToMs } = require("./utils");
const normalizeTitle = require("./normalize-title");
require("dotenv").config();

const moviedb = new MovieDb(process.env.MOVIEDB_API_KEY);

const searchMovieAndCacheResults = ({
  slug,
  year: yearValue,
  normalizedTitle,
}) =>
  dailyCache(`moviedb-search-${yearValue || "no-year"}-${slug}`, async () => {
    const getPayload = (additional = {}) => ({
      query: normalizedTitle,
      ...additional,
    });

    // If there's no year provided, just search for the title
    if (!yearValue) {
      return moviedb.searchMovie(getPayload());
    }

    const year = parseInt(yearValue, 10);

    // Try to find a movie first released on that year
    let search = await moviedb.searchMovie(
      getPayload({ primary_release_year: year }),
    );

    // If there's no matches, then try to find a movie with some release related
    // to that year
    if (search.results.length === 0) {
      search = await moviedb.searchMovie(getPayload({ year }));
    }

    // If there's no matches, sometimes the movie listing has the year off by 1,
    // so try to find a movie with some release related to the next year
    if (search.results.length === 0) {
      return moviedb.searchMovie(getPayload({ year: year + 1 }));
    }

    return search;
  });

const getMovieInfoAndCacheResults = ({ id }) =>
  dailyCache(`moviedb-info-${id}`, async () => {
    const payload = {
      id,
      append_to_response: "credits,external_ids,keywords,videos",
    };
    return moviedb.movieInfo(payload);
  });

const getMovieTitleAndYearFrom = (title) => {
  const hasYear = title.trim().match(/^(.*?)\s*\((\d{4})\)$/);
  if (hasYear)
    return {
      title: hasYear[1].trim(),
      year: hasYear[2],
    };
  return { title };
};

function getBestMatch(titleQuery, results) {
  // If there's only a few results returned, then pick the first
  if (results.length <= 3) return results[0];

  // If there's only one match that has the same title, then pick it
  const matches = results.filter(
    ({ title }) => normalizeTitle(title) === titleQuery.toLowerCase(),
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
      const title = normalizeTitle(show.title);
      const { title: normalizedTitle, year } = getMovieTitleAndYearFrom(title);
      const slug = slugify(normalizedTitle, { strict: true }).toLowerCase();
      const search = await searchMovieAndCacheResults({
        normalizedTitle,
        slug,
        year: year || show.overview.year,
      });

      const result = getBestMatch(normalizedTitle, search.results);
      if (!result || !result.release_date) return show;

      if (!show.overview.duration) {
        const movieInfo = await getMovieInfoAndCacheResults({ id: result.id });
        if (movieInfo.runtime) {
          show.overview.duration = parseMinsToMs(movieInfo.runtime);
        }
      }

      return {
        ...show,
        moviedb: {
          id: result.id,
          title: result.title,
          releaseDate: result.release_date,
          summary: result.overview,
        },
      };
    }),
  );
}

module.exports = hydrate;
