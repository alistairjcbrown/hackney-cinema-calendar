const {
  parseMinsToMs,
  convertToList,
  splitConjoinedItemsInList,
} = require("../../common/utils");

const fetchJson = async (url) => (await fetch(url)).json();

const fetchText = async (url) => (await fetch(url)).text();

const getText = ($el) => $el.text().trim();

const getParams = (page) =>
  new URLSearchParams({
    // Filters to just cinema
    "af[16]": 16,
    // Parameters required for drupal_ajax
    view_name: "event_calendar",
    view_display_id: "page",
    view_dom_id: "dom-id",
    "ajax_page_state[libraries]": "none",
    // Pagination
    page,
  });

const convertDurationStringToMinutes = (duration) => {
  if (!duration) return undefined;

  const hrsAndMinsString = duration
    .trim()
    .match(/^(?:(\d+)\s*hr?s?\s+)?(\d+)\s*mi?n?s?/i);
  const hoursString = duration.trim().match(/^(\d+)\s*hour?s?/i);
  const [, hours = 0, minutes = 0] = hrsAndMinsString || hoursString;
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
};

const getYear = (value) => value.match(/^(?:[^\s]+\s+)?(\d{4})\s+\w/i)?.[1];

const getDirectorDuration = (value) => {
  const match = value.match(/dirs?\.?\s+([^\d]+?)(\d+)\s*min/i);
  if (!match) return {};
  return { director: match[1], duration: match[2] };
};

const createOverview = ({
  duration,
  year,
  categories,
  directors,
  actors,
  certification,
}) => {
  return {
    duration: duration ? parseMinsToMs(duration) : undefined,
    year: year || undefined,
    categories: splitConjoinedItemsInList(convertToList(categories)),
    directors: splitConjoinedItemsInList(convertToList(directors)),
    actors: splitConjoinedItemsInList(convertToList(actors)),
    certification: certification || undefined,
  };
};

const createPerformance = ({ date, notesList, url, screen }) => ({
  time: date.getTime(),
  notes: notesList.join("\n").trim(),
  bookingUrl: url,
  screen: screen || undefined,
});

module.exports = {
  fetchJson,
  fetchText,
  getText,
  getParams,
  convertDurationStringToMinutes,
  getYear,
  getDirectorDuration,
  createOverview,
  createPerformance,
};
