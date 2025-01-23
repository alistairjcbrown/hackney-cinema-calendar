const { parse, isBefore, startOfDay, addYears } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const {
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
} = require("../../common/utils");

const fetchText = async (url) => (await fetch(url)).text();

const getText = ($el) => $el.text().trim();

const parseDate = ($el) => {
  const parsedDate = parse(getText($el), "EEE, d LLL", new Date(), {
    locale: enGB,
  });

  // It's unexpected to not find a parsable date, so throw
  if (isNaN(parsedDate.getTime())) throw new Error("Unable to parse date");

  // If the date is in the past, then it's probably on the year boundary
  // and we need to add a year
  const today = startOfDay(new Date());
  if (isBefore(parsedDate, today)) return addYears(parsedDate, 1);

  return parsedDate;
};

const createPerformance = ({ date, notesList, url, screen }) => ({
  time: date.getTime(),
  notes: notesList.join("\n").trim(),
  bookingUrl: url,
  screen: screen || undefined,
});

const createOverview = ({
  duration,
  year,
  categories,
  directors,
  actors,
  certification,
}) => {
  return {
    duration: parseMinsToMs(duration),
    year: year || undefined,
    categories: splitConjoinedItemsInList(convertToList(categories)),
    directors: splitConjoinedItemsInList(convertToList(directors)),
    actors: splitConjoinedItemsInList(convertToList(actors)),
    certification: certification || undefined,
  };
};

module.exports = {
  fetchText,
  getText,
  parseDate,
  createPerformance,
  createOverview,
};
