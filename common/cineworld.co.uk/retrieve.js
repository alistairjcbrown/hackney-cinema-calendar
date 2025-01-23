const { format, addYears } = require("date-fns");

const tenantId = "10108";

async function retrieve({ cinemaId }) {
  const apiUrl = "https://www.cineworld.co.uk/uk/data-api-service/v1";
  const untilDate = format(addYears(new Date(), 1), "yyyy-MM-dd");
  const activeDatesResponse = await fetch(
    `${apiUrl}/quickbook/${tenantId}/dates/in-cinema/${cinemaId}/until/${untilDate}?attr=&lang=en_GB`,
  );
  const activeDates = await activeDatesResponse.json();

  const movieListPage = [];
  for (activeDate of activeDates.body.dates) {
    const showingsOnDateResponse = await fetch(
      `${apiUrl}/quickbook/${tenantId}/film-events/in-cinema/${cinemaId}/at-date/${activeDate}?attr=&lang=en_GB`,
    );
    const showingsOnDate = await showingsOnDateResponse.json();
    movieListPage.push(showingsOnDate.body);
  }

  const filmIds = [
    ...new Set(movieListPage.flatMap(({ films }) => films.map(({ id }) => id))),
  ];

  const moviePages = {};
  for (filmId of filmIds) {
    const url = `${apiUrl}/${tenantId}/films/byDistributorCode/${filmId}`;
    const additionalFilmData = await (await fetch(url)).json();
    moviePages[filmId] = additionalFilmData.body;
  }

  return { movieListPage, moviePages };
}

module.exports = retrieve;
