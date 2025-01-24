const cheerio = require("cheerio");
const { setHours, setMinutes } = require("date-fns");
const {
  getText,
  createPerformance,
  createOverview,
} = require("../../common/utils");
const { calculate24Hours, parseDate } = require("./utils");

function getLine($, $lines, prefix) {
  let combinedLines = "";
  $lines.find("span").each(function () {
    const line = getText($(this));
    if (!line.startsWith(prefix)) return;
    combinedLines = `${combinedLines}, ${line.replace(prefix, "")}`;
  });
  return combinedLines;
}

function parseMovieProperties($, $movieProperties) {
  const properties = {
    categories: "",
  };
  let isAfterAgeRestriction = false;

  $movieProperties.find("span").each(function () {
    const movieProperty = getText($(this));

    // if it's just 4 digits, it's the year
    const year = movieProperty.match(/^(\d{4})$/);
    if (year) {
      properties.year = year[1];
      return;
    }

    // if it's digits ending in mins it's the duration
    const duration = movieProperty.match(/^(\d+)mins$/);
    if (duration) {
      properties.duration = duration[1];
      return;
    }

    // if it's digits ending in mins it's the duration
    const ageRestriction = movieProperty.match(/^\((\w+)\)$/);
    if (ageRestriction) {
      properties.classification = ageRestriction[1];
      isAfterAgeRestriction = true;
      return;
    }

    if (isAfterAgeRestriction) {
      properties.categories = `${properties.categories}, ${movieProperty}`;
    }
  });

  return properties;
}

async function transform(data, sourcedEvents) {
  const $ = cheerio.load(data);
  const $entries = $(".jacro-event");

  const movies = [];
  $entries.each(function () {
    const $entry = $(this);

    const $movieDetails = $entry.find(".jacrofilm-list-content");
    const $movieTitle = $movieDetails.find(".liveeventtitle");
    const $moviePeople = $movieDetails.find(".film-info");
    const $movieProperties = $movieDetails.find(".running-time");
    const title = getText($movieTitle);
    const url = $movieTitle.attr("href");

    const overview = createOverview({
      directors: getLine($, $moviePeople, "Directed by "),
      actors: getLine($, $moviePeople, "Starring "),
      ...parseMovieProperties($, $movieProperties),
    });

    const performances = [];
    const $performanceDays = $entry.find(".performance-list-items .heading");
    $performanceDays.each(function () {
      const $performanceDay = $(this);
      const date = parseDate(getText($performanceDay));

      let $currentElement = $performanceDay.next();
      while ($currentElement.is("li")) {
        const tags = [];
        $currentElement.find(".movietag .tag").each(function () {
          tags.push(getText($(this)));
        });

        const status = getText($currentElement.find(".hover"));
        let notesList = status.toLowerCase() !== "book" ? [status] : [];
        notesList.push(tags.join(", "));

        const [, hours, minutes, suffix] = getText(
          $currentElement.find(".time"),
        ).match(/^(\d+):(\d{2})\W+(\w{2})/i);

        const performanceTime = setHours(
          setMinutes(date, parseInt(minutes, 10)),
          calculate24Hours(hours, suffix),
        );

        const bookingUrl = $currentElement.find("a").attr("href");

        performances.push(
          createPerformance({
            date: performanceTime,
            notesList,
            url: bookingUrl || url,
          }),
        );
        $currentElement = $currentElement.next();
      }
    });

    movies.push({ title, url, overview, performances });
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
