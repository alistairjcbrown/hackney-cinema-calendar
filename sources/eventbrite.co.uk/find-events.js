const { readDailyCache } = require("../../common/cache");
const normalizeName = require("../../common/normalize-name");
const distanceInKmBetweenCoordinates = require("../../common/distance-in-km-between-coordinates");
const { cacheKey } = require("./attributes");

function convertEventbriteEvent(event) {
  const startDate = new Date(`${event.start_date}T${event.start_time}`);
  const endDate = new Date(`${event.end_date}T${event.end_time}`);

  const overview = {
    duration: (endDate.getTime() - startDate.getTime()) / 1000 / 60,
    categories: [],
    directors: [],
    actors: [],
  };

  const performances = [
    {
      time: startDate.getTime(),
      notes: "",
      bookingUrl: event.tickets_url,
    },
  ];

  return {
    title: event.name,
    url: event.url,
    overview,
    performances,
  };
}

function uniqueEvents(events) {
  const ids = {};
  return events.filter(function (event) {
    const isNewEvent = !ids[event.id];
    ids[event.id] = true;
    return isNewEvent;
  });
}

async function findEvents(cinema) {
  const data = readDailyCache(cacheKey) || [];

  const events = uniqueEvents(
    data.flatMap(
      ({
        search_data: {
          events: { results },
        },
      }) => results,
    ),
  );

  const filteredEvents = events.filter(
    ({
      is_cancelled: isCancelled,
      is_online_event: isOnline,
      primary_venue: {
        name,
        address: { longitude: lon, latitude: lat },
      },
    }) => {
      if (isCancelled || isOnline) return false;
      const distance = distanceInKmBetweenCoordinates(cinema.geo, { lat, lon });
      return (
        normalizeName(name) === normalizeName(cinema.name) && distance < 0.1
      );
    },
  );

  return filteredEvents.map(convertEventbriteEvent);
}

module.exports = findEvents;
