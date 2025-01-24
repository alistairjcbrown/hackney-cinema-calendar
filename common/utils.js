const { decode } = require("html-entities");
const { format, isAfter, startOfDay } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const replaceSpecialCharacters = require("replace-special-characters");

const generateEventDescription = (show, performance) => {
  let description = "";
  if (performance.screen)
    description += `Showing in screen ${performance.screen}\n`;
  if (show.overview.classification)
    description += `Film classification: ${show.overview.classification}\n`;
  if (show.overview.actors && show.overview.actors.length > 0)
    description += `Starring ${show.overview.actors.join(", ")}\n`;
  if (show.overview.directors && show.overview.directors.length > 0)
    description += `Directed by ${show.overview.directors.join(", ")}\n`;
  if (show.url) description += `For more details, see ${show.url}\n`;
  if (performance.bookingUrl)
    description += `Book tickets at ${performance.bookingUrl}\n`;
  if (performance.notes) description += `\nNotes:\n${performance.notes}\n`;
  if (show.moviedb) {
    description += `\n---\n\n`;
    description += `[Match found in The Movie Database]\n`;
    description += `${show.moviedb.title} (${show.moviedb.releaseDate.split("-")[0]}) - https://www.themoviedb.org/movie/${show.moviedb.id}\n`;
    description += `${show.moviedb.summary || "No summary available"}\n`;
  }
  return description.trim();
};

const getEventDate = (time) =>
  format(time, "yyyy-M-d-H-m", { locale: enGB })
    .split("-")
    .map((value) => parseInt(value, 10));

const filterHistoricalPerformances = (movies) => {
  const startOfToday = startOfDay(new Date());
  return movies.reduce((populatedMovies, movie) => {
    const performances = movie.performances.filter(({ time }) =>
      isAfter(time, startOfToday),
    );
    // Remove movies which don't have any performances
    if (performances.length === 0) return populatedMovies;
    return populatedMovies.concat({ ...movie, performances });
  }, []);
};

const convertToList = (value) => {
  if (!value) return [];
  const list = value
    .split(/,|\n|\||\/|&/g)
    .map((value) => value.replace(/\s+/g, " ").trim());
  return list.filter((item) => item !== "");
};

const splitConjoinedItemsInList = (list, joiner = " and ") => {
  return list.reduce(
    (updatedList, item) =>
      updatedList.concat(item.split(joiner).map((value) => value.trim())),
    [],
  );
};

const classifications = ["U", "PG", "12", "12A", "15", "18"];
const isValidClassification = (value = "") => {
  const sanitizedValue = (value ?? "")
    .toLowerCase()
    .replace("+", "")
    .replace("*", "")
    .replace(" certificate", "")
    .replace("advised ", "")
    .replace("r18", "18")
    .trim()
    .toUpperCase();
  return classifications.includes(sanitizedValue) ? sanitizedValue : undefined;
};

const parseMinsToMs = (value) => parseInt(value, 10) * 60 * 1000;

const sanitize = (value) =>
  replaceSpecialCharacters(value.replace(/\s+/g, " "));

const sanitizeRichText = (value) =>
  decode(value.replaceAll("<br />", "\n").trim());

const fetchText = async (url) => (await fetch(url)).text();

const fetchJson = async (url) => (await fetch(url)).json();

const getText = ($el) => $el.text().trim();

const createPerformance = ({ date, notesList, url, screen }) => ({
  time: date.getTime(),
  notes: notesList
    .map((value) => value?.trim())
    .filter((value) => !!value)
    .join("\n")
    .trim(),
  bookingUrl: url,
  screen: screen || undefined,
});

const createOverview = ({
  duration,
  year,
  categories = "",
  directors = "",
  actors = "",
  classification,
  trailer,
}) => {
  return {
    duration: parseMinsToMs(duration) || undefined,
    year: year || undefined,
    categories: Array.isArray(categories)
      ? categories
      : splitConjoinedItemsInList(convertToList(categories)),
    directors: Array.isArray(directors)
      ? directors
      : splitConjoinedItemsInList(convertToList(directors)),
    actors: Array.isArray(actors)
      ? actors
      : splitConjoinedItemsInList(convertToList(actors)),
    classification: isValidClassification(classification),
    trailer: trailer || undefined,
  };
};

module.exports = {
  generateEventDescription,
  getEventDate,
  filterHistoricalPerformances,
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
  sanitize,
  sanitizeRichText,
  fetchText,
  fetchJson,
  getText,
  createPerformance,
  createOverview,
};
