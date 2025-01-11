const { startOfDay, format, endOfDay, addYears } = require("date-fns");

async function retrieve({ domain, url, cinemaId }) {
  const mainPageResponse = await fetch(url);
  const mainPage = await mainPageResponse.text();
  const websiteId = mainPage.match(
    /name="boapp:website:id" content="([^"]+)"/i,
  )[1];
  // Extract the CMS hash URL from the main page
  const requestPrefix = mainPage.match(/src=\"([^"]+)webpack-runtime-/i)[1];
  const suffix = url.replace(domain, "");
  const pageDataResponse = await fetch(
    `${requestPrefix}page-data${suffix}page-data.json`,
  );
  const pageData = await pageDataResponse.json();

  let movieData = null;
  let attributeData = null;
  // Run through all page data blobs until we find the ones we want to keep
  for (hash of pageData.staticQueryHashes) {
    const dataResponse = await fetch(
      `${requestPrefix}page-data/sq/d/${hash}.json`,
    );
    const data = await dataResponse.json();

    // All movie data
    if (data?.data?.allMovie) {
      movieData = data.data;
    }

    // Attribute values
    if (data?.data?.allAttribute) {
      attributeData = data.data;
    }
  }

  const movieIds = movieData.allMovie.nodes.map(({ id }) => id);
  const today = new Date();
  const schedulePayload = {
    theaters: [{ id: cinemaId, timeZone: "Europe/London" }],
    movieIds,
    from: format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    to: format(endOfDay(addYears(today, 1)), "yyyy-MM-dd'T'HH:mm:ss"),
    nin: [],
    sin: [],
    websiteId,
  };

  const scheduleResponse = await fetch(
    "https://www.everymancinema.com/api/gatsby-source-boxofficeapi/schedule",
    {
      body: JSON.stringify(schedulePayload),
      method: "POST",
    },
  );
  const schedule = await scheduleResponse.json();

  return {
    schedule: schedule[cinemaId].schedule,
    movieData: movieData.allMovie.nodes,
    attributeData: attributeData.allAttribute.nodes,
  };
}

module.exports = retrieve;
