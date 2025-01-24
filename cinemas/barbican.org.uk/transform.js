const cheerio = require("cheerio");
const { parseISO } = require("date-fns");
const {
  getText,
  createOverview,
  createPerformance,
} = require("../../common/utils");
const {
  convertDurationStringToMinutes,
  getYear,
  getDirectorDuration,
} = require("./utils");

const convertSummaryToMapping = ($) => {
  const summary = {};
  $(".at-a-glance-row").each(function () {
    const $key = $(this).find("strong");
    const key = getText($key).toLowerCase().replace(":", "").trim();
    // Remove the key element so we can extract the value
    $key.remove();
    summary[key] = getText($(this));
  });
  return summary;
};

const convertFootnotesToMapping = ($) => {
  let footnotes = {};
  $(".further-credits p, .footnote p").each(function () {
    const footnoteContents = getText($(this));
    const year = getYear(footnoteContents);
    if (year) {
      const directorDuration = getDirectorDuration(footnoteContents);
      footnotes = { ...footnotes, ...directorDuration, year };
    }
  });
  return footnotes;
};

const convertMovieBlurbToDirectors = ($) => {
  // If we can't find a director in formatted spots, try and scan the blurb
  const movieBlurb = getText($(".js-show-more-content"));
  return movieBlurb.match(/Directed\s+by\s+(?:.+?\s+)?(\w+\s+\w+)\s+\(/i)?.[1];
};

function processListingPage(data) {
  const $ = cheerio.load(data);

  const summary = convertSummaryToMapping($);
  const footnotes = convertFootnotesToMapping($);
  const movieBlurbDirectors = convertMovieBlurbToDirectors($);

  const $title = $(".heading-group__primary");
  let title = getText($title);
  const $titleSpecific = $title.find("> span");
  if ($titleSpecific.length > 0) title = getText($titleSpecific.eq(0));

  return {
    url: $('link[rel="canonical"]').attr("href"),
    title,
    venue: getText($("#venue").parent()),
    overview: createOverview({
      duration: summary.runtime
        ? convertDurationStringToMinutes(summary.runtime)
        : footnotes.duration,
      year: summary["release year"] || footnotes.year,
      directors: summary.director || footnotes.director || movieBlurbDirectors,
      certification: getText($("._classification")).replace(/[()]/g, "").trim(),
    }),
  };
}

function processPerformancePage(data, fallbackUrl, fallbackScreen) {
  const $ = cheerio.load(data);

  const performances = [];
  $(".instance-listing").each(function () {
    const $bookingButton = $(this).find(".instance-listing__button a");

    const notesList = [];
    if (getText($bookingButton).toLowerCase() === "sold out") {
      notesList.push("Sold out");
    }

    const $tags = $(this).find(".instance-accessibility-tags");
    $tags.each(function () {
      const tag = getText($(this)).toLowerCase();
      if (tag === "ad") {
        notesList.push(
          "This event is audio described. Commentary is provided through a headset describing visual action that is essential to understanding the story as it unfolds. For audio description headphones, please contact a member of Barbican staff on arrival at your venue.",
        );
      }
      if (tag === "cap") {
        notesList.push(
          "This event is captioned. Captioning is a format that includes text description of significant sound effects as well as dialogue.",
        );
      }
    });

    const dateTime = $(this).find(".instance-time__time time").attr("datetime");
    const screen = getText($(this).find(".instance-listing__venue"));
    performances.push(
      createPerformance({
        date: parseISO(dateTime),
        notesList,
        url: $bookingButton.attr("href") || fallbackUrl,
        screen: screen || fallbackScreen,
      }),
    );
  });
  return performances;
}

async function transform({ moviePages }, sourcedEvents) {
  const movies = moviePages.map(
    ({ title: searchTitle, listingPage, performancePage }) => {
      const {
        url,
        title: listingPageTitle,
        venue,
        overview,
      } = processListingPage(listingPage);
      const performances = processPerformancePage(performancePage, url, venue);
      const useFallbackTitle = searchTitle.endsWith("..") && listingPageTitle;
      const title = useFallbackTitle ? listingPageTitle : searchTitle;
      return {
        title,
        url,
        overview,
        performances,
      };
    },
  );

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
