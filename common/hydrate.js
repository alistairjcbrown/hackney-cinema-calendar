const slugify = require("slugify");
const { MovieDb } = require("moviedb-promise");
const { dailyCache } = require("./cache");
require("dotenv").config();

const moviedb = new MovieDb(process.env.MOVIEDB_API_KEY);

const getAndCacheData = ({ slug, year, normalizedTitle }) =>
  dailyCache(`moviedb-${slug}`, async () => {
    const payload = { query: normalizedTitle };
    if (year) payload.year = year;
    const search = await moviedb.searchMovie(payload);

    // If there's a year available, sometimes the movie listing
    // the year off by 1. Let's try again with the year incremented.
    if (search.results.length === 0 && year) {
      payload.year = year + 1;
      return moviedb.searchMovie(payload);
    }

    return search;
  });

function normalize(title) {
  title = title.toLowerCase();

  const hasPresents = title.match(/\s+presents:?\s+(.*?)$/i);
  if (hasPresents) {
    title = hasPresents[1];
  }

  const hasPresented = title.match(/^(.*?)\s+presented\s+/i);
  if (hasPresented) {
    title = hasPresented[1];
  }

  const hasSeparator = title.match(/^(.*?)\s+(?:\+|\-)\s*/);
  if (hasSeparator) {
    title = hasSeparator[1];
  }

  const hasSquareBracketDate = title.trim().match(/^(.*?)\[(\d{4})\](.*?)$/);
  if (hasSquareBracketDate) {
    title = `${hasSquareBracketDate[1]}(${hasSquareBracketDate[2]})${hasSquareBracketDate[3]}`;
  }

  const hasBrackets = title.match(/^(.*?)\s+\[/);
  if (hasBrackets) {
    title = hasBrackets[1];
  }

  const knownRemovablePhrases = [
    ": Double Feature",
    "Sing-A-Long-A",
    "Re-release",
    "Rerelease",
    ": Director's Definitive Edition",
    "4K Restoration",
    ": The Final Cut",
    ": Final Cut",
    "Theatrical Cut",
    "Director's Cut",
    "40th Anniversar",
    "PINK PALACE:",
    "Classic Matinee:",
    ": Family Flicks Hallowe'en Special",
    "Bar Trash:",
    "Staff Selects Halloween Special:",
    "Carers & Babies:",
    "Carers & Babies Club:",
    "DOC'N ROLL:",
    "Doc'N Roll FF 24:",
    "Doc'n Roll Film Festival Presents:",
    "for Halloween",
    "- UK PREMIERE",
    ": ANI DiFRANCO",
    "- Filum Film Club",
    "Scared To Dance -",
    "FILM CLUB:",
    "Call To Action:",
    "Carers and Babies Club:",
    "Film Africa:",
    "The Dead Carpet :",
    "ATOMIC ORIGINS:",
    "Exhibition On Screen:",
    "Green Screen:",
    "SLA:",
    "OUT at Clapham:",
    "OUT:",
    "UK Premiere:",
    "London Korean Film Festival Opening Gala:",
    "London Korean Film Festival Closing Night Gala:",
    "Closing Night Gala:",
    "60th anniversary screenings",
    "60th anniversary screening",
    "with intro",
    "with Dr Catherine Lester",
    "with Tim Robey",
    "(BFI Classics) with David Forrest",
    "Library Talks Screening:",
    "Funday:",
    "Halloween special:",
    "Preview:",
    "Preview screening:",
    "LSF 2025:",
    "Seniors’ Free Talk:",
    "Seniors’ Free Matinee:",
    "Seniors’ Matinee:",
    "Relaxed screening:",
    "Member Mondays:",
    "Member Picks:",
    "Member screening:",
    "Member Exclusive:",
    "Art of Action:",
    "Opening Night:",
    "Library Talk:",
    "New Writings:",
    "Closing Night:",
    "28th MADE IN PRAGUE FESTIVAL:",
    "28th MADE IN PRAGE FESTIVAL GALA:",
    "CinemaItaliaUK Special Screening of",
    ": SCRT X MUBI PRESENT",
    "London Breeze Festival:",
  ];
  knownRemovablePhrases.forEach((phrase) => {
    title = title.replace(phrase.toLowerCase(), "");
  });

  const hasYear = title.trim().match(/\(\d{4}\)$/);
  if (!hasYear) {
    title = title.replace(/\([^(]*\)$/, "").trim();
    title = title.replace(/\([^(]*\)$/, "").trim(); // Do it twice in case there's more paraenthesis
  }

  return title
    .replace(/\s*:\s+/g, ": ")
    .trim()
    .replace(/:$/, "")
    .trim();
}

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
    ({ title }) => title.toLowerCase() === titleQuery.toLowerCase(),
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
      const title = normalize(show.title);
      const { title: normalizedTitle, year } = getMovieTitleAndYearFrom(title);
      const slug = slugify(normalizedTitle, { strict: true }).toLowerCase();
      const search = await getAndCacheData({
        normalizedTitle,
        slug,
        year: year || show.overview.year,
      });

      const result = getBestMatch(normalizedTitle, search.results);
      if (!result || !result.release_date) return show;

      const moviedb = {
        id: result.id,
        title: result.title,
        releaseDate: result.release_date,
        summary: result.overview,
      };
      return { ...show, moviedb };
    }),
  );
}

module.exports = hydrate;
