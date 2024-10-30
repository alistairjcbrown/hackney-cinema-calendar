const cheerio = require("cheerio");
const { parse, isBefore, startOfDay, addYears } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { dailyCache } = require("../../common/cache");
const {
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
} = require("../../common/utils");
const { domain } = require("./attributes");
const retrieve = require("./retrieve");

async function getAdditionalDataFor(pageUrls) {
  const additionalData = await Promise.all(
    Object.keys(pageUrls).map(async (id) => {
      const key = `thecastlecinema.com-show-${id}`;
      const data = await dailyCache(key, () => retrieve(pageUrls[id]));
      const $ = cheerio.load(data);
      const addiitionalData = {
        id,
        duration: parseMinsToMs(
          $(".film-duration").text().replace("mins", "").trim(),
        ),
        year: $(".film-year").text().trim(),
        categories: [],
        directors: splitConjoinedItemsInList(
          convertToList($(".meta .meta-line .film-director").text().trim()),
        ),
        actors: splitConjoinedItemsInList(
          convertToList($(".meta .meta-line .film-cast").text().trim()),
        ),
      };

      if ($(".bbfc img").attr("alt")) {
        addiitionalData.certification = $(".bbfc img")
          .attr("alt")
          .replace("BBFC ", "")
          .trim();
      }

      return addiitionalData;
    }),
  );

  return additionalData.reduce(
    (mapping, { id, ...data }) => ({ ...mapping, [id]: data }),
    {},
  );
}

async function transform(data) {
  const $ = cheerio.load(data);
  const timelineEntries = $("#slim-tiles").children();

  const pageUrls = {};
  timelineEntries.each(function () {
    const $entry = $(this);
    const id = $entry.attr("data-prog-id");
    if (!id) return;
    const url = `${domain}${$entry.find(".tile-name").parent().attr("href")}`;
    pageUrls[id] = url;
  });

  const movieAdditionalData = await getAdditionalDataFor(pageUrls);
  const movies = {};
  let date;
  timelineEntries.each(function () {
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
      movies[id] = {
        title: $entry.find(".tile-name").text().trim(),
        url: `${domain}${$entry.find(".tile-name").parent().attr("href")}`,
        overview: movieAdditionalData[id] || {},
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

      const [time, ...notes] = $link
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .split(" ");
      const [hours, minutes] = time.split(":");
      movies[id].performances = movies[id].performances.concat([
        {
          time: new Date(date.getTime()).setHours(
            parseInt(hours, 10),
            parseInt(minutes, 10),
          ),
          notes: (notes || []).join(" ").trim(),
          bookingUrl: `${domain}${$link.attr("href")}`,
        },
      ]);
    });
  });

  return Object.values(movies);
}

module.exports = transform;
