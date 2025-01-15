const { parseMinsToMs, convertToList } = require("../../common/utils");

const getCertificate = (attributeIds) => {
  if (attributeIds.includes("u")) return "U";
  if (attributeIds.includes("pg")) return "PG";
  if (attributeIds.includes("12a")) return "12A";
  if (attributeIds.includes("15")) return "15";
  if (attributeIds.includes("18")) return "18";
  return undefined;
};

const getCategories = (attributeIds) => {
  const categories = [];
  if (attributeIds.includes("adventure")) categories.push("Adventure");
  if (attributeIds.includes("drama")) categories.push("Drama");
  if (attributeIds.includes("action")) categories.push("Action");
  if (attributeIds.includes("animation")) categories.push("Animation");
  if (attributeIds.includes("horror")) categories.push("Horror");
  if (attributeIds.includes("comedy")) categories.push("Comedy");
  return categories;
};

async function transform(venue, { filmShowings, filmData }, sourcedEvents) {
  const movies = {};
  let events = [];

  filmShowings.forEach((dayData) => {
    events = events.concat(dayData.events);

    dayData.films.forEach((film) => {
      const additionalData = filmData[film.id].filmDetails;

      const overview = {
        duration: film.length ? parseMinsToMs(film.length) : undefined,
        categories: getCategories(film.attributeIds),
        directors: convertToList(additionalData.directors),
        actors: convertToList(additionalData.cast),
      };

      if (film.videoLink) {
        overview.trailer = film.videoLink;
      }

      const certificate = getCertificate(film.attributeIds);
      if (certificate) {
        overview.certificate = certificate;
      }

      // Ignore placeholders for private screenings
      if (film.name.toUpperCase() === "THEATRE LET") return;

      movies[film.id] = {
        title: film.name,
        url: film.link,
        overview,
        performances: [],
      };
    });
  });

  events.forEach((event) => {
    const movie = movies[event.filmId];

    // If the movie isn't available, then we've omitted it previously
    if (!movie) return;

    let notes = "";
    if (event.soldOut) notes += "\nSold out";
    event.attributeIds.forEach((attributeId) => {
      if (attributeId === "audio-described") {
        notes += `\This is an audio described screening. A special headset will be supplied if required. The performance is otherwise unaffected and is suitable for all customers.`;
      }
      if (attributeId === "subbed") {
        notes += `\nThis is a subtitled screening`;
      }
      if (attributeId === "classicfilm") {
        notes += `\nThis is a classic film`;
      }
    });

    movie.performances = movie.performances.concat({
      time: new Date(event.eventDateTime).getTime(),
      screen: event.auditorium,
      notes: notes.trim(),
      bookingUrl: event.bookingLink,
    });
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
