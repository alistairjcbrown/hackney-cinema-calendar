const slugify = require("slugify");
const { format } = require("date-fns");
const diff = require("fast-diff");
const { parseMinsToMs } = require("./utils");
const normalizeTitle = require("./normalize-title");
const {
  searchMovieAndCacheResults,
  getMovieInfoAndCacheResults,
} = require("./get-movie-data");

const compareAsSimilar = (firstString, secondString) => {
  if (firstString === secondString) return true;

  // Compare strings, calculating a score based on the number of characters that
  // have changed. This following counts the number of characters changed
  // (additions and deletions).
  const lettersChanges = diff(firstString, secondString).reduce(
    (count, [score, letters]) => (score === 0 ? count : count + letters.length),
    0,
  );
  // The threshold of 2 below allows for 1 character to mismatch (a character
  // deleted and then another added), or a difference of 2 characters in length.
  return lettersChanges <= 2;
};

const normalizeName = (name) =>
  name
    .toLowerCase()
    .replace(", jr.", "")
    .replace("mehrotra jenkins", "mehrotra")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "")
    .replace(/\./g, "");

const matchesExpectedCastCrew = async (match, show) => {
  const movieInfo = await getMovieInfoAndCacheResults(match);
  const crew = movieInfo.credits.crew.flatMap(({ name }) => [
    normalizeName(name),
    normalizeName(name.split(" ").reverse().join(" ")),
  ]);

  // If there's no crew information to check against, let's assume it's a match
  if (crew.length === 0) return true;

  const directors = show.overview.directors.map((name) => normalizeName(name));
  // Don't bother checking the Opera listings, they're usualy wrong
  if (directors.length && directors[0] === "themetropolitanopera") return true;

  const directorMatches = crew.filter((member) =>
    directors.some((director) => compareAsSimilar(director, member)),
  );
  if (directorMatches.length > 0) return true;

  const cast = movieInfo.credits.cast.flatMap(({ name }) => [
    normalizeName(name),
    normalizeName(name.split(" ").reverse().join(" ")),
  ]);

  // If there's no cast information to check against, let's assume it's a match
  if (cast.length === 0) return true;

  const actors = show.overview.actors.map((name) => normalizeName(name));
  const actorMatches = cast.filter((member) =>
    actors.some((actor) => compareAsSimilar(actor, member)),
  );
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

  // If there's only one result ...
  if (rawResults.length === 1) {
    const result = rawResults[0];
    // ... and there's no crew info, pick the result
    if (!hasCrewForShow) return result;
    // ... and there's crew info, use it to match the result
    const hasCastCrewMatch = await matchesExpectedCastCrew(result, show);
    return hasCastCrewMatch ? result : undefined;
  }

  // As we have more than 1 result, filter these down by removing any which
  // don't have a release date (if it's in the cinema, it should have a release
  // date available).
  const resultsWithReleaseDate = rawResults.filter(
    ({ release_date: date }) => !!date,
  );

  // If there's only a few results remaining ...
  if (resultsWithReleaseDate.length <= 3) {
    // ... and there's no crew info, pick the first as the most likely
    if (!hasCrewForShow) return resultsWithReleaseDate[0];
    // ... and there's crew info, use it to match a result ...
    for (result of resultsWithReleaseDate) {
      const hasCastCrewMatch = await matchesExpectedCastCrew(result, show);
      if (hasCastCrewMatch) return result;
    }
    // ... or reject the results if we can't match against any of them
    return undefined;
  }

  // As we still have more than 3 results, filter these down by removing any
  // which don't have the same normalized title as our query (this will probbaly
  // fail for foreign language films where the title may not match).
  const resultsWithSameTitle = resultsWithReleaseDate.filter(
    ({ title, original_title: originalTitle }) =>
      normalizeTitle(title) === titleQuery ||
      normalizeTitle(originalTitle) === titleQuery,
  );

  // If there's only one result ...
  if (resultsWithSameTitle.length === 1) {
    const result = resultsWithSameTitle[0];
    // ... and there's no crew info, pick the result
    if (!hasCrewForShow) return result;
    // ... and there's crew info, use it to match the result
    const hasCastCrewMatch = await matchesExpectedCastCrew(result, show);
    return hasCastCrewMatch ? result : undefined;
  }

  // As we still have more than 1 result ...
  if (!hasCrewForShow) {
    // If there's no crew info, pick the most popular so long as it's has a
    // relatively high level of popularity.
    const relativelyHighPopularity = 15;
    const popularResults = resultsWithSameTitle
      .filter(({ popularity }) => popularity > relativelyHighPopularity)
      .sort((a, b) => b.popularity - a.popularity);
    if (popularResults.length > 0) return popularResults[0];
  } else {
    // If there's crew info, use it to match the result
    for (result of resultsWithSameTitle) {
      const hasCastCrewMatch = await matchesExpectedCastCrew(result, show);
      if (hasCastCrewMatch) return result;
    }
  }

  // Reject the results if there are none that we can match confidently
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
