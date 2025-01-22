const cheerio = require("cheerio");
const { parse, isBefore, startOfDay, addYears } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const {
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
} = require("../../common/utils");
const { domain } = require("./attributes");

async function getAdditionalDataFor(moviePages) {
  const additionalData = await Promise.all(
    Object.keys(moviePages).map(async (url) => {
      const $ = cheerio.load(moviePages[url]);
      const year = $(".film-year")
        .text()
        .trim()
        .match(/(\d{4})/);

      const additionalData = {
        url,
        duration: parseMinsToMs(
          $(".film-duration").text().replace("mins", "").trim(),
        ),
        year: year ? year[1] : undefined,
        categories: [],
        directors: splitConjoinedItemsInList(
          convertToList($(".meta .meta-line .film-director").text().trim()),
        ),
        actors: splitConjoinedItemsInList(
          convertToList($(".meta .meta-line .film-cast").text().trim()),
        ),
      };

      if ($(".bbfc img").attr("alt")) {
        additionalData.certification = $(".bbfc img")
          .attr("alt")
          .replace("BBFC ", "")
          .trim();
      }

      return additionalData;
    }),
  );

  return additionalData.reduce(
    (mapping, { url, ...data }) => ({ ...mapping, [url]: data }),
    {},
  );
}

async function transform({ movieListPage, moviePages }, sourcedEvents) {
  const $ = cheerio.load(movieListPage);

  const movieAdditionalData = await getAdditionalDataFor(moviePages);
  const movies = {};
  let date;
  $("#slim-tiles")
    .children()
    .each(function () {
      const $entry = $(this);
      if ($entry.hasClass("date")) {
        const dateString = $entry.text().trim();
        const parsedDate = parse(dateString, "EEE, d LLL", new Date(), {
          locale: enGB,
        });

        if (!isNaN(parsedDate.getTime())) {
          const today = startOfDay(new Date());

          // If the date is in the past, then it's probably on the year boundary
          // and we need to add a year
          if (isBefore(parsedDate, today)) {
            date = addYears(parsedDate, 1);
          } else {
            date = parsedDate;
          }
        }
        return;
      }

      const id = $entry.attr("data-prog-id");
      if (!id) return;

      if (!movies[id]) {
        const url = `${domain}${$(this).find(".tile-details > a").attr("href")}`;
        movies[id] = {
          title: $entry.find(".tile-name").text().trim(),
          url,
          overview: movieAdditionalData[url] || {},
          performances: [],
        };
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

        let notes = $link.find(".screening-type").text().trim();
        if ($link.hasClass("is-sold-out")) {
          notes += "\nSold out";
        } else if ($link.hasClass("low-availability")) {
          notes += "\nLast few seats";
        }
        const [time] = $link.text().replace(/\s+/g, " ").trim().split(" ");
        const [hours, minutes] = time.split(":");
        movies[id].performances = movies[id].performances.concat([
          {
            time: new Date(date.getTime()).setHours(
              parseInt(hours, 10),
              parseInt(minutes, 10),
            ),
            notes: notes.trim(),
            bookingUrl: `${domain}${$link.attr("href")}`,
            screen: $link.find(".screen").text().trim(),
          },
        ]);
      });
    });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
