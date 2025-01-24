const { parseISO } = require("date-fns");
const { createOverview, createPerformance } = require("../../common/utils");

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

async function transform(venue, { movieListPage, moviePages }, sourcedEvents) {
  const movies = {};
  let events = [];

  movieListPage.forEach((dayData) => {
    events = events.concat(dayData.events);

    dayData.films.forEach((film) => {
      const additionalData = moviePages[film.id].filmDetails;

      const overview = createOverview({
        duration: film.length,
        categories: getCategories(film.attributeIds),
        directors: additionalData.directors,
        actors: additionalData.cast,
        trailer: film.videoLink,
        classification: getCertificate(film.attributeIds),
      });

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

    const notesList = [];
    if (event.soldOut) notesList.push("Sold out");
    event.attributeIds.forEach((attributeId) => {
      if (attributeId === "audio-described") {
        notesList.push(
          "This is an audio described screening. A special headset will be supplied if required. The performance is otherwise unaffected and is suitable for all customers.",
        );
      }
      if (attributeId === "subbed") {
        notesList.push("This is a subtitled screening");
      }
      if (attributeId === "classicfilm") {
        notesList.push("This is a classic film");
      }
    });

    movie.performances = movie.performances.concat(
      createPerformance({
        date: parseISO(event.eventDateTime),
        screen: event.auditorium,
        notesList,
        url: event.bookingLink,
      }),
    );
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
