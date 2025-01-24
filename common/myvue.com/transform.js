const {
  parseMinsToMs,
  convertToList,
  sanitizeRichText,
} = require("../../common/utils");

async function transform({ domain, url }, { result: movies }, sourcedEvents) {
  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return movies
    .reduce((moviesAtCinema, movie) => {
      if (movie.showingGroups.length === 0) return moviesAtCinema;

      const overview = {
        categories: movie.genres || [],
        directors: convertToList(movie.director.replace(/\s+/g, " ")),
        actors: convertToList(movie.cast.replace(/\s+/g, " ")),
        duration: movie.runningTime
          ? parseMinsToMs(movie.runningTime)
          : undefined,
      };

      if (movie.certification?.name) {
        overview.certification = movie.certification.name;
      }

      const transformedMovie = {
        title: movie.filmTitle,
        url: movie.filmUrl.replace(domain, url),
        overview,
        performances: movie.showingGroups.reduce(
          (performances, { sessions }) =>
            performances.concat(
              sessions.map((showing) => {
                const date = new Date(showing.showTimeWithTimeZone);
                return {
                  time: date.getTime(),
                  screen: showing.screenName.replace("Screen ", ""),
                  notes: (showing.attributes || [])
                    .reduce(
                      (notes, { shortName: title, description }) =>
                        title && description
                          ? notes.concat(
                              `${title}: ${sanitizeRichText(description)}`,
                            )
                          : notes,
                      [],
                    )
                    .join("\n"),
                  bookingUrl: `${domain}${showing.bookingUrl}`,
                };
              }),
            ),
          [],
        ),
      };
      return moviesAtCinema.concat([transformedMovie]);
    }, [])
    .concat(listOfSourcedEvents);
}

module.exports = transform;
