const { format, isAfter, startOfDay } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const replaceSpecialCharacters = require("replace-special-characters");

const generateEventDescription = (show, performance) => {
  let description = "";
  if (performance.screen)
    description += `Showing in screen ${performance.screen}\n`;
  if (show.overview["age-restriction"])
    description += `Film classification: ${show.overview["age-restriction"]}\n`;
  if (show.overview.actors && show.overview.actors.length > 0)
    description += `Starring ${show.overview.actors.join(", ")}\n`;
  if (show.overview.directors && show.overview.directors.length > 0)
    description += `Directed by ${show.overview.directors.join(", ")}\n`;
  if (show.url) description += `For more details, see ${show.url}\n`;
  if (performance.bookingUrl)
    description += `Book tickets at ${performance.bookingUrl}\n`;
  if (performance.notes) description += `\nNotes:\n${performance.notes}\n`;
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
  return value.split(/,|\n|\||\//g).map((value) => value.trim());
};

const parseMinsToMs = (value) => parseInt(value, 10) * 60 * 1000;

const sanitize = (value) =>
  replaceSpecialCharacters(value.replace(/\s+/g, " "));

module.exports = {
  generateEventDescription,
  getEventDate,
  filterHistoricalPerformances,
  convertToList,
  parseMinsToMs,
  sanitize,
};
