const { MovieDb } = require("moviedb-promise");
const { dailyCache } = require("./cache");
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

    // Check we haven't matched a "making of" documentary, and if we have search
    // the previous year
    if (
      search.results.length === 1 &&
      search.results[0].title.toLowerCase().startsWith("making")
    ) {
      search = await moviedb.searchMovie(
        getPayload({ primary_release_year: year - 1 }),
      );
    }

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
      append_to_response: "credits,external_ids,keywords,release_dates,videos",
    };
    return moviedb.movieInfo(payload);
  });

const getMovieGenresAndCacheResults = () =>
  dailyCache(`moviedb-genres`, async () => {
    return moviedb.genreMovieList();
  });

module.exports = {
  searchMovieAndCacheResults,
  getMovieInfoAndCacheResults,
  getMovieGenresAndCacheResults,
};
