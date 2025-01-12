async function retrieve({ cinemaId }, { url, apiUrl, authToken }) {
  const getHeaders = () => ({
    Accept: "application/json",
    authorization: `Bearer ${authToken}`,
  });

  const prefix = url || apiUrl;
  const screeningDatesResponse = await fetch(
    `${prefix}/ocapi/v1/film-screening-dates?siteIds=${cinemaId}`,
    { headers: getHeaders() },
  );
  const { filmScreeningDates } = await screeningDatesResponse.json();

  return Promise.all(
    filmScreeningDates.map(async ({ businessDate }) => {
      const showtimesResponse = await fetch(
        `${prefix}/ocapi/v1/showtimes/by-business-date/${businessDate}?siteIds=${cinemaId}`,
        { headers: getHeaders() },
      );
      return showtimesResponse.json();
    }),
  );
}

module.exports = retrieve;
