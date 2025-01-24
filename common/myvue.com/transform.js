const {
  sanitizeRichText,
  createOverview,
  createPerformance,
} = require("../../common/utils");

async function transform(
  { domain, url },
  { result: movieData },
  sourcedEvents,
) {
  const movies = movieData.reduce((moviesAtCinema, movie) => {
    if (movie.showingGroups.length === 0) return moviesAtCinema;

    const overview = createOverview({
      categories: movie.genres,
      directors: movie.director,
      actors: movie.cast,
      duration: movie.runningTime,
      certification: movie.certification?.name,
    });

    const performances = movie.showingGroups.flatMap(({ sessions }) =>
      sessions.map((showing) =>
        createPerformance({
          date: new Date(showing.showTimeWithTimeZone),
          screen: showing.screenName.replace("Screen ", ""),
          notesList: (showing.attributes || []).reduce(
            (notes, { shortName: title, description }) =>
              title && description
                ? notes.concat(`${title}: ${sanitizeRichText(description)}`)
                : notes,
            [],
          ),
          url: `${domain}${showing.bookingUrl}`,
        }),
      ),
    );

    const transformedMovie = {
      title: movie.filmTitle,
      url: movie.filmUrl.replace(domain, url),
      overview,
      performances,
    };
    return moviesAtCinema.concat(transformedMovie);
  }, []);

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
