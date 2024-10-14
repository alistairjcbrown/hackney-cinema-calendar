const cheerio = require("cheerio");
const {
  parse,
  isBefore,
  startOfDay,
  addYears,
  setHours,
  setMinutes,
} = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { convertToList, parseMinsToMs } = require("../../utils");

function getListFromLine($, $lines, prefix) {
  let list = [];
  $lines.find("span").each(function () {
    const line = $(this).text().trim();
    if (line.startsWith(prefix)) {
      list = list.concat(convertToList(line.replace(prefix, "")));
    }
  });
  return list;
}

function calculate24Hours(hoursString, suffix) {
  const hours = parseInt(hoursString, 10);
  const isPostMeridian = suffix.toLowerCase() === "pm";
  if (hours == 12 && !isPostMeridian) return hours - 12;
  if (hours < 12 && isPostMeridian) return hours + 12;
  return hours;
}

function parseMovieProperties($, $movieProperties) {
  const schemaProperties = {
    categories: [],
  };
  const otherProperties = {};
  let isAfterAgeRestriction = false;

  $movieProperties.find("span").each(function () {
    const movieProperty = $(this).text().trim();

    // if it's just 4 digits, it's the year
    const year = movieProperty.match(/^(\d{4})$/);
    if (year) {
      otherProperties.year = year[1];
      return;
    }

    // if it's digits ending in mins it's the duration
    const duration = movieProperty.match(/^(\d+)mins$/);
    if (duration) {
      schemaProperties.duration = parseMinsToMs(duration[1]);
      return;
    }

    // if it's digits ending in mins it's the duration
    const ageRestriction = movieProperty.match(/^\((\w+)\)$/);
    if (ageRestriction) {
      schemaProperties["age-restriction"] = ageRestriction[1];
      isAfterAgeRestriction = true;
      return;
    }

    if (isAfterAgeRestriction) {
      schemaProperties.categories = schemaProperties.categories.concat(
        convertToList(movieProperty),
      );
    }
  });

  return { schemaProperties, otherProperties };
}

async function transform(data) {
  const $ = cheerio.load(data);
  const $entries = $(".jacro-event");

  const movies = [];
  $entries.each(function () {
    const $entry = $(this);

    const $movieDetails = $entry.find(".jacrofilm-list-content");
    const $movieTitle = $movieDetails.find(".liveeventtitle");
    const $moviePeople = $movieDetails.find(".film-info");
    const $movieProperties = $movieDetails.find(".running-time");
    const parsedProperties = parseMovieProperties($, $movieProperties);
    const overview = {
      directors: getListFromLine($, $moviePeople, "Directed by "),
      actors: getListFromLine($, $moviePeople, "Starring "),
      ...parsedProperties.schemaProperties,
    };

    const performances = [];
    const $moviePerformanceDays = $entry.find(
      ".performance-list-items .heading",
    );
    $moviePerformanceDays.each(function () {
      $moviePerformanceDay = $(this);
      const dateString = $moviePerformanceDay.text().trim();
      const parsedDate = parse(dateString, "EEEE do LLLL", new Date(), {
        locale: enGB,
      });
      if (isNaN(parsedDate.getTime())) return;

      let date;
      const today = startOfDay(new Date());
      // If the date is in the past, then it's probably on the year boundary
      // and we need to add a year
      if (isBefore(parsedDate, today)) {
        date = addYears(parsedDate, 1);
      } else {
        date = parsedDate;
      }

      let $currentElement = $moviePerformanceDay.next();
      while ($currentElement.is("li")) {
        const status = $currentElement.find(".hover").text().trim();
        const tags = [];
        $currentElement.find(".movietag .tag").each(function () {
          tags.push($(this).text().trim());
        });

        const noteStatus = status.toLowerCase() !== "book" ? `${status}\n` : "";
        const noteTags = tags.length > 0 ? tags.join(", ") : "";

        const [, hours, minutes, suffix] = $currentElement
          .find(".time")
          .text()
          .trim()
          .match(/^(\d+):(\d{2})\W+(\w{2})/i);

        performances.push({
          time: setHours(
            setMinutes(date, parseInt(minutes, 10)),
            calculate24Hours(hours, suffix),
          ).getTime(),
          notes: `${noteStatus}${noteTags}`,
          bookingUrl:
            $currentElement.find("a").attr("href") || $movieTitle.attr("href"),
        });
        $currentElement = $currentElement.next();
      }
    });

    movies.push({
      title: $movieTitle.text().trim(),
      url: $movieTitle.attr("href"),
      overview,
      performances,
    });
  });

  return movies;
}

module.exports = transform;
