const { format, addYears } = require("date-fns");
const { dailyCache } = require("../cache");

const tenantId = "10108";

async function retrieve({ cinemaId }) {
  const apiUrl = "https://www.cineworld.co.uk/uk/data-api-service/v1";
  const untilDate = format(addYears(new Date(), 1), "yyyy-MM-dd");
  const activeDatesResponse = await fetch(
    `${apiUrl}/quickbook/${tenantId}/dates/in-cinema/${cinemaId}/until/${untilDate}?attr=&lang=en_GB`,
  );
  const activeDates = await activeDatesResponse.json();

  const filmShowings = [];
  for (activeDate of activeDates.body.dates) {
    const showingsOnDateResponse = await fetch(
      `${apiUrl}/quickbook/${tenantId}/film-events/in-cinema/${cinemaId}/at-date/${activeDate}?attr=&lang=en_GB`,
    );
    const showingsOnDate = await showingsOnDateResponse.json();
    filmShowings.push(showingsOnDate.body);
  }

  const filmIds = [
    ...new Set(filmShowings.flatMap(({ films }) => films.map(({ id }) => id))),
  ];

  const filmData = {};
  for (filmId of filmIds) {
    const additionalFilmData = await dailyCache(
      `cineworld.co.uk-info-${filmId}`,
      async () => {
        const url = `${apiUrl}/${tenantId}/films/byDistributorCode/${filmId}`;
        return (await fetch(url)).json();
      },
    );
    filmData[filmId] = additionalFilmData.body;
  }

  return { filmShowings, filmData };
}

module.exports = retrieve;
