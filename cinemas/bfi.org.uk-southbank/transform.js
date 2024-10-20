const cheerio = require("cheerio");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { dailyCache } = require("../../common/cache");
const { convertToList, parseMinsToMs } = require("../../common/utils");
const { domain } = require("./attributes");
const retrieve = require("./retrieve");

function getPerformancesFrom($, url) {
  const $performances = $(".search-results-container .item-description");
  const performances = [];
  $performances.each(function () {
    const showTime = $(this).find(".start-date").text().trim();
    const date = parse(showTime, "EEEE dd MMMM yyyy HH:mm", new Date(), {
      locale: enGB,
    });
    performances.push({
      bookingUrl: url,
      screen: $(this).find(".item-venue").text().trim(),
      notes: "",
      time: date.getTime(),
    });
  });
  return performances;
}

async function getShow({ url }) {
  if (!url.startsWith(domain) || url.includes("Online/https://")) return;

  const id = url.replace(`${domain}article/`, "");
  const key = `bfi.org.uk-southbank-show-${id}`;
  const data = await dailyCache(key, () => retrieve(url));
  const $ = cheerio.load(data);

  const overview = {
    categories: [],
    directors: [],
    actors: [],
  };
  const $showInfo = $("ul.Film-info__information li");
  $showInfo.each(function () {
    const heading = $(this)
      .find(".Film-info__information__heading")
      .text()
      .trim()
      .toLowerCase();
    const content = $(this).find(".Film-info__information__value").text();

    if (heading === "director" && overview.directors.length === 0) {
      overview.directors = convertToList(content);
    } else if (heading === "with" && overview.actors.length === 0) {
      overview.actors = convertToList(content);
    } else if (heading === "certificate" && !overview["age-restriction"]) {
      overview["age-restriction"] = content;
    } else {
      const hasTimings = content.match(/\s+(\d{4}).\s+(\d+)min$/i);
      if (hasTimings && !overview.year) {
        overview.year = hasTimings[1];
      }
      if (hasTimings && !overview.duration) {
        overview.duration = parseMinsToMs(hasTimings[2]);
      }
    }
  });

  if (!overview.duration) overview.duration = parseMinsToMs(90);

  let performances = await getPerformancesFrom($, url);
  const performancePages = [];
  $(".pagination .av-paging-links a").each(function () {
    const pageNumber = parseInt($(this).text().trim(), 10);
    if (!Number.isInteger(pageNumber)) return;
    performancePages.push({
      number: pageNumber,
      url: `${domain}${$(this)
        .attr("href")
        .replace(/sToken=[^&]+&/, "")}`,
    });
  });

  for (performancePage of performancePages) {
    const data = await dailyCache(`${key}-${performancePage.number}`, () =>
      retrieve(performancePage.url),
    );
    const $ = cheerio.load(data);
    performances = performances.concat(await getPerformancesFrom($, url));
  }

  if (performances.length === 0) return;

  return {
    title: $("h1.Page__heading").text().trim(),
    url,
    overview,
    performances,
  };
}

async function transform(data) {
  const $ = cheerio.load(data);
  const $showLinks = $(".Rich-text li a");
  const showData = [];
  $showLinks.each(function () {
    showData.push({
      title: $(this).text().trim(),
      url: `${domain}${$(this).attr("href")}`,
    });
  });

  const shows = [];
  for (showURL of showData) {
    const show = await getShow(showURL);
    if (!show) continue;
    shows.push(show);
  }

  return shows;
}

module.exports = transform;
