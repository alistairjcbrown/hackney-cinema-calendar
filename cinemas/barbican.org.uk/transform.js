const cheerio = require("cheerio");
const { parseMinsToMs, convertToList } = require("../../common/utils");
const { parseISO } = require("date-fns");

const convertToMs = (runtime) => {
  if (!runtime) return undefined;
  const [, hours = 0, minutes] = runtime
    .trim()
    .match(/^(?:(\d+)\s*hr?s?\s+)?(\d+)\s*mi?n?s?/i);
  return parseMinsToMs(parseInt(hours, 10) * 60 + parseInt(minutes, 10));
};

function processListingPage(data) {
  const $ = cheerio.load(data);

  const summary = {};
  $(".at-a-glance-row").each(function () {
    const key = $(this)
      .find("strong")
      .text()
      .toLowerCase()
      .replace(":", "")
      .trim();
    $(this).find("strong").remove();
    const value = $(this).text().trim();
    summary[key] = value;
  });

  const footnotes = {};
  $(".further-credits p, .footnote p").each(function () {
    const footnoteContents = $(this).text().trim();
    const matchYear = footnoteContents.match(/^(?:[^\s]+\s+)?(\d{4})\s+\w/i);
    if (matchYear) {
      footnotes.year = matchYear[1];
      const matchDirectorDuration = footnoteContents.match(
        /dirs?\.?\s+([^\d]+?)(\d+)\s*min/i,
      );
      if (matchDirectorDuration) {
        footnotes.director = matchDirectorDuration[1];
        footnotes.duration = matchDirectorDuration[2];
      }
    }
  });

  const $title = $(".heading-group__primary");
  let title = $title.text().trim();
  if ($title.find("> span").length > 0) {
    title = $title.find("> span").eq(0).text().trim();
  }

  const getDirectors = () => {
    if (summary.director) return convertToList(summary.director);
    if (footnotes.director) return convertToList(footnotes.director);

    // If we can't find a director in formatted spots, try and scan the blurb
    const movieBlurb = $(".js-show-more-content").text().trim();
    const directedByMatch = movieBlurb.match(
      /Directed\s+by\s+(?:.+?\s+)?(\w+\s+\w+)\s+\(/i,
    );
    if (directedByMatch) {
      return convertToList(directedByMatch[1]);
    }

    return [];
  };
  const getDuration = () => {
    if (summary.runtime) return convertToMs(summary.runtime);
    if (footnotes.duration) return parseMinsToMs(footnotes.duration);
    return undefined;
  };
  const certification =
    $("._classification").text().replace(/[()]/g, "").trim() || undefined;

  return {
    url: $('link[rel="canonical"]').attr("href"),
    title,
    year: summary["release year"] || footnotes.year,
    duration: getDuration(),
    certification,
    directors: getDirectors(),
    venue: $("#venue").parent().text().trim(),
  };
}

function processPerformancePage(data, fallbackUrl, fallbackScreen) {
  const $ = cheerio.load(data);

  const performances = [];
  $(".instance-listing").each(function () {
    const dateTime = $(this).find(".instance-time__time time").attr("datetime");
    const screen = $(this).find(".instance-listing__venue").text().trim();
    const $bookingButton = $(this).find(".instance-listing__button a");
    const bookingText = $bookingButton.text().toLowerCase().trim();

    let notes = "";
    if (bookingText === "sold out") {
      notes += "Sold out";
    }

    $(this)
      .find(".instance-accessibility-tags")
      .each(function () {
        const tag = $(this).text().toLowerCase().trim();
        if (tag === "ad") {
          notes += `\nThis event is audio described. Commentary is provided through a headset describing visual action that is essential to understanding the story as it unfolds. For audio description headphones, please contact a member of Barbican staff on arrival at your venue.`;
        }
        if (tag === "cap") {
          notes += `\nThis event is captioned. Captioning is a format that includes text description of significant sound effects as well as dialogue.`;
        }
      });

    performances.push({
      time: parseISO(dateTime).getTime(),
      screen: screen || fallbackScreen,
      notes: notes.trim(),
      bookingUrl: $bookingButton.attr("href") || fallbackUrl,
    });
  });
  return performances;
}

async function transform(movies, sourcedEvents) {
  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return movies
    .map(({ title: searchTitle, listingPage, performancePage }) => {
      const {
        url,
        title: pageTitle,
        year,
        duration,
        certification,
        directors,
        venue,
      } = processListingPage(listingPage);
      const performances = processPerformancePage(performancePage, url, venue);
      const title =
        searchTitle.endsWith("..") && pageTitle ? pageTitle : searchTitle;
      return {
        title,
        url,
        overview: {
          year,
          duration,
          certification,
          categories: [],
          directors,
          actors: [],
        },
        performances,
      };
    })
    .concat(listOfSourcedEvents);
}

module.exports = transform;
