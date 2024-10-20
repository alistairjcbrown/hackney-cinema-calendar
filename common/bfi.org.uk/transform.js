const cheerio = require("cheerio");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { convertToList, parseMinsToMs } = require("../utils");

function getOverviewFor({ html }) {
  const $ = cheerio.load(html);

  const overview = {
    categories: [],
    directors: [],
    actors: [],
  };
  const $showInfo = $("ul.Film-info__information li");
  $showInfo.each(function () {
    const heading = $(this)
      .find(".Film-info__information__heading")
      .text()
      .trim()
      .toLowerCase();
    const content = $(this).find(".Film-info__information__value").text();

    if (heading === "director" && overview.directors.length === 0) {
      overview.directors = convertToList(content);
    } else if (heading === "with" && overview.actors.length === 0) {
      overview.actors = convertToList(content);
    } else if (heading === "certificate" && !overview["age-restriction"]) {
      overview["age-restriction"] = content;
    } else {
      const hasTimings = content.match(/\s+(\d{4}).\s+(\d+)min$/i);
      if (hasTimings && !overview.year) {
        overview.year = hasTimings[1];
      }
      if (hasTimings && !overview.duration) {
        overview.duration = parseMinsToMs(hasTimings[2]);
      }
    }
  });

  if (!overview.duration) overview.duration = parseMinsToMs(90);

  return overview;
}

async function getPerformancesFor(pageUrl, { performances }) {
  const showPerformances = [];
  for (performance of performances) {
    const $ = cheerio.load(performance);
    const showTime = $(".start-date").text().trim();
    const date = parse(showTime, "EEEE dd MMMM yyyy HH:mm", new Date(), {
      locale: enGB,
    });
    showPerformances.push({
      bookingUrl: pageUrl,
      screen: $(".item-venue").text().trim(),
      notes: "",
      time: date.getTime(),
    });
  }
  return showPerformances;
}

async function transform({ url }, showData) {
  const shows = [];

  for (showPath in showData) {
    const show = showData[showPath];

    shows.push({
      title: show.title,
      url: `${url}?${showPath}`,
      overview: getOverviewFor(show),
      performances: await getPerformancesFor(`${url}?${showPath}`, show),
    });
  }

  return shows;
}

module.exports = transform;
