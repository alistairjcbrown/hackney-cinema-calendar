const { createOverview, createPerformance } = require("../utils");
const { parseDate } = require("./utils");

async function transform(
  { cinemaId, domain },
  { filmData: { films, screenings, screeningTypes } },
  sourcedEvents,
) {
  const movies = Object.values(films).reduce((moviesAtThreate, movie) => {
    const siteMovieScreenings = movie.screenings.byCinema[cinemaId];
    if (!siteMovieScreenings) return moviesAtThreate;

    const overview = createOverview({
      year: movie.premiere.split("-")[0],
      classification: movie.rating,
      directors: movie.director,
    });

    const movieUrl = `${domain}${movie.link}`;
    const show = {
      title: movie.title,
      url: movieUrl,
      overview,
      performances: [],
    };

    const screeningIds = Object.values(siteMovieScreenings).flatMap(
      (screeningIds) => screeningIds,
    );
    show.performances = screeningIds.map((screeningId) => {
      const screening = screenings[screeningId];

      const notesList = [];
      if (screening.st) {
        notesList.push(screeningTypes[screening.st].title);
      }

      return createPerformance({
        date: parseDate(`${screening.d}T${screening.t}`),
        screen: screening.sn,
        notesList,
        url: screening.link ? `${domain}${screening.link}` : movieUrl,
      });
    });

    return moviesAtThreate.concat(show);
  }, []);

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
