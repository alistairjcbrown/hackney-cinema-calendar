const slugify = require("slugify");
const { format } = require("date-fns");
const { parseMinsToMs } = require("./utils");
const normalizeTitle = require("./normalize-title");
const {
  searchMovieAndCacheResults,
  getMovieInfoAndCacheResults,
} = require("./get-movie-data");

const normalizeName = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "")
    .replace(/\./g, "");

const matchesExpectedCrew = async (match, show) => {
  const movieInfo = await getMovieInfoAndCacheResults(match);
  const crew = movieInfo.credits.crew.flatMap(({ name }) => [
    normalizeName(name),
    normalizeName(name.split(" ").reverse().join(" ")),
    normalizeName(name).slice(0, -1),
  ]);

  // If there's no crew information to check against, let's assume it's a match
  if (crew.length === 0) return true;

  const directors = show.overview.directors.map((name) => normalizeName(name));
  // Don't bother checking the Opera listings, they're usualy wrong
  if (directors.length && directors[0] === "themetropolitanopera") return true;

  const directorMatches = crew.filter((member) => directors.includes(member));
  if (directorMatches.length > 0) return true;

  const actors = show.overview.actors.map((name) => normalizeName(name));
  const actorMatches = crew.filter((member) => actors.includes(member));
  if (actorMatches.length > 0) return true;

  return false;
};

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

async function getBestMatch(titleQuery, rawResults, show) {
  const hasCrewForShow =
    show.overview.directors.length > 0 || show.overview.actors.length > 0;

  // If there's only one result, then use it
  if (rawResults.length === 1) {
    const match = rawResults[0];
    // If there's no crew information, pick this match
    if (!hasCrewForShow) return match;
    // If there's is crew information, use it to confirm the match
    const hasCrewMatch = await matchesExpectedCrew(match, show);
    return hasCrewMatch ? match : undefined;
  }

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

  // If there's no one obvious match, and we have a crew information, then let's
  // use that information to help decide
  if (hasCrewForShow) {
    for (match of matches) {
      const hasDirectorMatch = await matchesExpectedCrew(match, show);
      if (hasDirectorMatch) return match;
    }
  }

  return undefined;
}

async function hydrate(shows) {
  const hydratedShows = [];
  for (show of shows) {
    const title = normalizeTitle(show.title, { retainYear: true });
    const { title: normalizedTitle, year } = getMovieTitleAndYearFrom(title);
    const slug = slugify(normalizedTitle, { strict: true }).toLowerCase();
    const search = await searchMovieAndCacheResults({
      normalizedTitle,
      slug,
      year: year || show.overview.year,
    });

    const bestMatch = await getBestMatch(normalizedTitle, search.results, show);

    const result = bestMatch || getManualMatch(normalizedTitle, show);
    if (!result) {
      hydratedShows.push(show);
      continue;
    }

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
    hydratedShows.push({
      ...show,
      moviedb: {
        id: result.id,
        title: result.title,
        releaseDate: result.release_date || defaultReleaseDate,
        summary: result.overview,
      },
    });
  }
  return hydratedShows;
}

module.exports = hydrate;
