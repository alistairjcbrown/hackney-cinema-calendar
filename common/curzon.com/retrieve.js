const getPageWithPlaywright = require("../get-page-with-playwright");

async function retrieve({ domain, url }) {
  const mainPageResponse = await fetch(url);
  const mainPage = await mainPageResponse.text();
  const inititialiseData = JSON.parse(
    mainPage.match(/^\s+occInititialiseData:\s+({.+}),$/im)[1],
  );
  const workflowDataData = JSON.parse(
    mainPage.match(/^\s+workflowData:\s+({.+}),$/im)[1],
  );
  const { url: apiUrl, authToken } = inititialiseData.api;
  const { siteId: cinemaId } = workflowDataData.entityIds;
  const getHeaders = () => ({
    Accept: "application/json",
    authorization: `Bearer ${authToken}`,
  });

  const screeningDatesResponse = await fetch(
    `${apiUrl}/ocapi/v1/film-screening-dates?siteIds=${cinemaId}`,
    { headers: getHeaders() },
  );
  const { filmScreeningDates } = await screeningDatesResponse.json();

  return Promise.all(
    filmScreeningDates.map(async ({ businessDate }) => {
      const showtimesResponse = await fetch(
        `${apiUrl}/ocapi/v1/showtimes/by-business-date/${businessDate}?siteIds=${cinemaId}`,
        { headers: getHeaders() },
      );
      return showtimesResponse.json();
    }),
  );
}

module.exports = retrieve;
