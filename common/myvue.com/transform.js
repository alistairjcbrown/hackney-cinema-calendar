const {
  filterHistoricalPerformances,
  parseMinsToMs,
  convertToList,
} = require("../../common/utils");

async function transform({ domain, url }, { result: movies }) {
  return movies.reduce((moviesAtCinema, movie) => {
    if (movie.showingGroups.length === 0) return moviesAtCinema;

    const overview = {
      categories: movie.genres || [],
      directors: convertToList(movie.director),
      actors: convertToList(movie.cast),
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
      performances: filterHistoricalPerformances(
        movie.showingGroups.reduce(
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
                          ? notes.concat(`${title}: ${description}`)
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
      ),
    };
    return moviesAtCinema.concat([transformedMovie]);
  }, []);
}

module.exports = transform;
