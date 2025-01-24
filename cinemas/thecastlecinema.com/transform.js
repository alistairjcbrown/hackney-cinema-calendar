const cheerio = require("cheerio");
const { setHours, setMinutes } = require("date-fns");
const { domain } = require("./attributes");
const {
  getText,
  createPerformance,
  createOverview,
} = require("../../common/utils");
const { parseDate } = require("./utils");

const getEntry = ($el, movieAdditionalData) => {
  const url = `${domain}${$el.find(".tile-details > a").attr("href")}`;
  const title = getText($el.find(".tile-name"));
  const overview = movieAdditionalData[url];

  // It's unexpected to not find a overview information, so throw
  if (!overview) throw new Error("No overview information");

  return { title, url, overview, performances: [] };
};

async function getAdditionalDataFor(moviePages) {
  return Object.keys(moviePages).reduce((mapping, url) => {
    const $ = cheerio.load(moviePages[url]);

    const data = createOverview({
      duration: getText($(".film-duration")).replace("mins", ""),
      year: getText($(".film-year")).match(/(\d{4})/)?.[0],
      directors: getText($(".meta .meta-line .film-director")),
      actors: getText($(".meta .meta-line .film-cast")),
      certification: $(".bbfc img").attr("alt")?.replace("BBFC ", "")?.trim(),
    });

    return { ...mapping, [url]: data };
  }, {});
}

async function transform({ movieListPage, moviePages }, sourcedEvents) {
  const $ = cheerio.load(movieListPage);
  const $listEntry = $("#slim-tiles").children();

  const movieAdditionalData = await getAdditionalDataFor(moviePages);
  const movies = {};
  let date;

  $listEntry.each(function () {
    const $entry = $(this);
    if ($entry.hasClass("date")) {
      // Ignore the final heading which doesn't have a date
      if (getText($entry).toLowerCase() !== "the end") {
        date = parseDate(getText($entry));
      }
      return;
    }

    // Ignore the intro text element
    if ($entry.hasClass("intro")) return;

    const id = $entry.attr("data-prog-id");
    if (!id) throw new Error("No listing ID found");

    if (!movies[id]) {
      movies[id] = getEntry($entry, movieAdditionalData);
    }

    const $performanceLinks = $entry.find(".film-times a");
    $performanceLinks.each(function () {
      const $link = $(this);

      // Remove hidden text
      $link.children().filter(function () {
        if ($(this).css("display") === "none") {
          $(this).remove();
        }
      });

      let notesList = [getText($link.find(".screening-type"))];
      if ($link.hasClass("is-sold-out")) {
        notesList.push("Sold out");
      } else if ($link.hasClass("low-availability")) {
        notesList.push("Last few seats");
      }

      const [hours, minutes] = getText($link).split(" ")[0].split(":");

      movies[id].performances = movies[id].performances.concat(
        createPerformance({
          date: setMinutes(
            setHours(date, parseInt(hours, 10)),
            parseInt(minutes, 10),
          ),
          notesList,
          url: `${domain}${$link.attr("href")}`,
          screen: getText($link.find(".screen")),
        }),
      );
    });
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
