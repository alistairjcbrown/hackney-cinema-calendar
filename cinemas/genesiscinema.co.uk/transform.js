const cheerio = require("cheerio");
const slugify = require("slugify");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { dailyCache } = require("../../common/cache");
const { parseMinsToMs, convertToList } = require("../../common/utils");
const { domain } = require("./attributes");
const retrieve = require("./retrieve");

async function getAdditionalDataFor(pageUrls) {
  const additionalData = await Promise.all(
    Object.keys(pageUrls).map(async (id) => {
      const key = `genesiscinema.co.uk-show-${id}`;
      const data = await dailyCache(key, () => retrieve(pageUrls[id]));
      const $ = cheerio.load(data);
      const addiitionalData = {
        id,
        categories: [],
        directors: [],
        actors: [],
      };

      $(".container .grid h1")
        .parent()
        .find("p")
        .each(function () {
          const contents = $(this).text().trim();

          const hasCategories = contents.match(/Genre:\s+(.*)$/i);
          if (hasCategories) {
            addiitionalData.categories = convertToList(hasCategories[1]);
          }

          const hasDirector = contents.match(/Directed by:\s+(.*)$/i);
          if (hasDirector) {
            addiitionalData.directors = convertToList(hasDirector[1]);
          }

          const hasActors = contents.match(/Starring:\s+(.*)$/i);
          if (hasActors) {
            addiitionalData.actors = convertToList(hasActors[1]);

            if (addiitionalData.actors.length === 1) {
              addiitionalData.actors = addiitionalData.actors[0]
                .split(" and ")
                .map((actor) => actor.trim());
            }
          }

          const hasDate = contents.match(/Release Date:\s+(.*)$/i);
          if (hasDate) {
            addiitionalData.year = hasDate[1].split("/")[2];
          }
        });

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
  const $days = $(".whatson_panel");

  const pageUrls = {};
  $days.each(function () {
    const $day = $(this);
    const $movieShowings = $day.find("> div > div");
    $movieShowings.each(function () {
      const $movieShowing = $(this);
      const $titleInfo = $movieShowing.find("h2");
      const movieId = $titleInfo.find("a").attr("href").replace("event/", "");
      const url = `${domain}/${$titleInfo.find("a").attr("href")}`;
      pageUrls[movieId] = url;
    });
  });

  const movieAdditionalData = await getAdditionalDataFor(pageUrls);
  const movies = {};
  $days.each(function () {
    const $day = $(this);
    const dayId = $day.attr("id").replace("panel_", "");
    const [, year, month, day] = dayId.match(/^(\d{4})(\d{2})(\d{2})$/);

    const $movieShowings = $day.find("> div > div");
    $movieShowings.each(function () {
      const $movieShowing = $(this);
      const $titleInfo = $movieShowing.find("h2");
      const title = $titleInfo.find("a").text().trim();
      const id = slugify(title);

      if (!movies[id]) {
        const $duration = $titleInfo.parent().next();
        let duration = parseMinsToMs(90);

        const durationText = $duration.text().trim();
        const durationMatch = durationText.match(
          /^Running time:\W+(\d+)\W*mins$/,
        );
        if (durationMatch) {
          duration = parseMinsToMs(durationMatch[1]);
        }

        const movieId = $titleInfo.find("a").attr("href").replace("event/", "");
        const overview = {
          duration,
          categories: [],
          directors: [],
          actors: [],
          ...movieAdditionalData[movieId],
        };

        const ageRestriction = $titleInfo.next().attr("alt");
        if (ageRestriction && !ageRestriction.startsWith("TBC")) {
          overview["age-restriction"] = ageRestriction;
        }

        const $trailerLink = $movieShowing.find(".text-right a.text-black");
        const youtubeCall = $trailerLink.attr("onclick").trim();
        const youtubeMatch = youtubeCall.match(/^showTrailer\('(\w+)'\)$/);
        if (youtubeMatch) {
          overview.trailer = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
        }

        movies[id] = {
          // Fix for special characters not encoding correctly in calendar
          title: title.replace(/’/g, "'").replace(/–/g, "-"),
          url: `${domain}/${$titleInfo.find("a").attr("href")}`,
          overview,
          performances: [],
        };
      }

      const $performances = $titleInfo.parent().parent().find("a.perfButton");
      $performances.each(function () {
        $performance = $(this);
        const $bookingButton = $performance.children().last();
        const [hours, minutes] = $bookingButton.text().trim().split(":");

        let notes = "";
        $performance.find("i").each(function () {
          const indicatorClass = $(this).attr("class").trim();
          const indicator = indicatorClass.match(/\ba1-event-(\w+)\b/);
          if (indicator) {
            notes = `${notes}\n${indicator[1]}`;
          }
        });

        movies[id].performances = movies[id].performances.concat([
          {
            time: parse(
              `${year}-${month}-${day} ${hours}:${minutes}`,
              "yyyy-MM-dd HH:mm",
              new Date(),
              {
                locale: enGB,
              },
            ).getTime(),
            notes: notes.trim(),
            bookingUrl: $performance.attr("href"),
          },
        ]);
      });
    });
  });

  return Object.values(movies).filter(
    ({ performances }) => performances.length !== 0,
  );
}

module.exports = transform;
