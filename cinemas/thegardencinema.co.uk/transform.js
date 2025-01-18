const cheerio = require("cheerio");
const { parse, startOfDay, isBefore } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { parseMinsToMs, convertToList } = require("../../common/utils");

const isCatchAll = (value) => value.toLowerCase().trim().startsWith("various");

function getPerformances($, $filmScreenings) {
  const performances = [];
  const $screenings = $filmScreenings.find(".screening-panel");
  $screenings.each(function (index) {
    let notes = "";
    if ($(this).hasClass("pay_what_you_can")) {
      notes +=
        "\nThe screening is Pay What You Can, which means you’re free to pay as much or as little as you can afford.";
    }
    if ($(this).hasClass("intro")) {
      notes += "\nThe screening will be introduced.";
    }
    if ($(this).hasClass("q_and_a")) {
      notes += "\nThe screening will be followed by a Q&A.";
    }
    if ($(this).hasClass("hoh")) {
      notes += "\nOpen captioned screening for the hard of hearing.";
    }
    if ($(this).hasClass("sold-out")) {
      notes += "\nSold out";
    }

    let $screeningDate = $(this).find(".screening-panel__date-title");
    // Note: This will break if the venue only ever has more than 2 performances
    // in a single day
    if ($screeningDate.length === 0) {
      $screeningDate = $screenings
        .eq(index - 1)
        .find(".screening-panel__date-title");
    }
    const dateString = $screeningDate.text().trim();
    const $screeningTime = $(this).find(".screening-time");
    const timeString = $screeningTime.text().trim();

    let date;
    const parsedDate = parse(
      `${dateString} T ${timeString}`,
      "EEE dd MMM 'T' HH:mm",
      new Date(),
      {
        locale: enGB,
      },
    );

    const today = startOfDay(new Date());
    // If the date is in the past, then it's probably on the year boundary
    // and we need to add a year
    if (isBefore(parsedDate, today)) {
      date = addYears(parsedDate, 1);
    } else {
      date = parsedDate;
    }

    performances.push({
      time: date.getTime(),
      notes: notes.trim(),
      bookingUrl: $screeningTime.find("a").attr("href"),
    });
  });
  return performances;
}

async function transform({ movieListPage, moviePages }, sourcedEvents) {
  const movies = moviePages.map((moviePages) => {
    const $ = cheerio.load(moviePages);
    const $title = $(".film-detail__title");
    const $ceritification = $title.find(".film-detail__film__rating");
    const certification = $ceritification.text().trim();
    $ceritification.remove();
    const title = $title.text().trim();
    const $stats = $(".film-detail__film__stats");
    $stats.children().each(function () {
      $(this).remove();
    });
    const stats = $stats
      .text()
      .trim()
      .split(",")
      .map((value) => value.trim());
    const directors = isCatchAll(stats[0]) ? [] : [stats[0]];
    const year = isCatchAll(stats[stats.length - 2])
      ? undefined
      : stats[stats.length - 2];
    const duration = stats[stats.length - 1];
    const $cast = $(".film-detail__cast");
    $cast.children().each(function () {
      $(this).remove();
    });

    return {
      title,
      url: $('link[rel="canonical"]').attr("href"),
      overview: {
        year,
        duration: parseMinsToMs(duration.replace("m.", "")),
        certification,
        categories: [],
        directors,
        actors: convertToList($cast.text().trim()),
      },
      performances: getPerformances($, $(".film-detail__screenings").eq(0)),
    };
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
