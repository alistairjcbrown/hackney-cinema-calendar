const cheerio = require("cheerio");
const { dailyCache } = require("../../common/cache");
const { domain } = require("./attributes");

const getParams = (page) =>
  new URLSearchParams({
    // Filters to just cinema
    "af[16]": 16,
    // Parameters required for drupal_ajax
    view_name: "event_calendar",
    view_display_id: "page",
    view_dom_id: "dom-id",
    "ajax_page_state[libraries]": "none",
    // Pagination
    page,
  });

async function retrieve() {
  let page = 1;

  const movieIds = new Set();
  const movieTitles = {};
  while (true) {
    const responseData = await dailyCache(
      `barbican.org.uk-page-${page}`,
      async () =>
        (await fetch(`${domain}/views/ajax?${getParams(page)}`)).json(),
    );
    const { data } = responseData.find(
      ({ method }) => method === "infiniteScrollInsertView",
    );
    const $ = cheerio.load(data);

    if ($(".no-result-message").length > 0) break;

    $(".listing--event").each(function () {
      const movieId = $(this)
        .find("button.saved-event-button")
        .data("saved-event-id");

      movieIds.add(movieId);
      movieTitles[movieId] = $(this).find(".listing-title--event").text();
    });

    page++;
  }

  const movies = [];
  for (movieId of movieIds) {
    const performancesUrl = `${domain}/whats-on/event/${movieId}/performances`;
    const listingUrl = `${domain}/node/${movieId}`;

    const [performancePage, listingPage] = await Promise.all([
      dailyCache(`barbican.org.uk-info-${movieId}-performances`, async () =>
        fetch(performancesUrl).then((response) => response.text()),
      ),
      dailyCache(`barbican.org.uk-info-${movieId}-listing`, async () =>
        fetch(listingUrl).then((response) => response.text()),
      ),
    ]);

    movies.push({
      movieId,
      title: movieTitles[movieId],
      performancePage,
      listingPage,
    });
  }

  return movies;
}

module.exports = retrieve;
