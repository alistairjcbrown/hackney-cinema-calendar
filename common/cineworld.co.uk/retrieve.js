const { format, addYears } = require("date-fns");

const tenantId = "10108";

async function retrieve({ cinemaId }) {
  const apiUrl =
    "https://www.cineworld.co.uk/uk/data-api-service/v1/quickbook/";
  const untilDate = format(addYears(new Date(), 1), "yyyy-MM-dd");
  const activeDatesResponse = await fetch(
    `${apiUrl}${tenantId}/dates/in-cinema/${cinemaId}/until/${untilDate}?attr=&lang=en_GB`,
  );
  const activeDates = await activeDatesResponse.json();

  const data = [];
  for (activeDate of activeDates.body.dates) {
    const showingsOnDateResponse = await fetch(
      `${apiUrl}${tenantId}/film-events/in-cinema/${cinemaId}/at-date/${activeDate}?attr=&lang=en_GB`,
    );
    const showingsOnDate = await showingsOnDateResponse.json();
    data.push(showingsOnDate.body);
  }

  return data;
}

module.exports = retrieve;
