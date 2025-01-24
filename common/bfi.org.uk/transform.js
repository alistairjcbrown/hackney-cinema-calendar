const cheerio = require("cheerio");
const { createOverview, getText, createPerformance } = require("../utils");
const { parseDate } = require("./utils");

function getOverviewFor({ html }) {
  const $ = cheerio.load(html);

  const overview = {
    categories: "",
    directors: "",
    actors: "",
  };

  const $showInfo = $("ul.Film-info__information li");
  $showInfo.each(function () {
    const heading = getText(
      $(this).find(".Film-info__information__heading"),
    ).toLowerCase();
    const content = getText($(this).find(".Film-info__information__value"));

    if (heading === "director" && !overview.directors) {
      overview.directors = content;
    } else if (heading === "with" && !overview.actors) {
      overview.actors = content;
    } else if (heading === "certificate" && !overview.certification) {
      overview.certification = content;
    } else {
      const hasTimings = content.match(/\s+(\d{4}).\s+(\d+)min(?:\s|$)/i);
      if (hasTimings && !overview.year) {
        overview.year = hasTimings[1];
      }
      if (hasTimings && !overview.duration) {
        overview.duration = hasTimings[2];
      }
    }
  });

  return createOverview(overview);
}

function getPerformancesFor(url, { performances }) {
  const showPerformances = [];
  for (performance of performances) {
    const $ = cheerio.load(performance);
    showPerformances.push(
      createPerformance({
        url,
        screen: getText($(".item-venue")),
        notesList: [],
        date: parseDate(getText($(".start-date"))),
      }),
    );
  }
  return showPerformances;
}

async function transform({ url }, { moviePages }, sourcedEvents) {
  const shows = [];

  for (showPath in moviePages) {
    const show = moviePages[showPath];
    shows.push({
      title: show.title,
      url: `${url}?${showPath}`,
      overview: getOverviewFor(show),
      performances: getPerformancesFor(`${url}?${showPath}`, show),
    });
  }

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return shows.concat(listOfSourcedEvents);
}

module.exports = transform;
