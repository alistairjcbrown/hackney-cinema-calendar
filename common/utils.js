const { decode } = require("html-entities");
const { format, isAfter, startOfDay } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const replaceSpecialCharacters = require("replace-special-characters");

const generateEventDescription = (show, performance) => {
  let description = "";
  if (performance.screen)
    description += `Showing in screen ${performance.screen}\n`;
  if (show.overview.certification)
    description += `Film classification: ${show.overview.certification}\n`;
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

const filterHistoricalPerformances = (performances) => {
  const startOfToday = startOfDay(new Date());
  return performances.filter(({ time }) => isAfter(time, startOfToday));
};

const convertToList = (value) => {
  if (!value) return [];
  return value.split(/,|\n|\||\/|&/g).map((value) => value.trim());
};

const splitConjoinedItemsInList = (list, joiner = " and ") => {
  return list.reduce(
    (updatedList, item) =>
      updatedList.concat(item.split(joiner).map((value) => value.trim())),
    [],
  );
};

const parseMinsToMs = (value) => parseInt(value, 10) * 60 * 1000;

const sanitize = (value) =>
  replaceSpecialCharacters(value.replace(/\s+/g, " "));

const sanitizeRichText = (value) =>
  decode(value.replaceAll("<br />", "\n").trim());

module.exports = {
  generateEventDescription,
  getEventDate,
  filterHistoricalPerformances,
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
  sanitize,
  sanitizeRichText,
};
