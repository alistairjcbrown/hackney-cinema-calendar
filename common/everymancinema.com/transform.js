const { parseMinsToMs, convertToList } = require("../../common/utils");

async function transform(
  { domain, cinemaId },
  { movieListPage, moviePages: { movieData, attributeData } },
  sourcedEvents,
) {
  const movies = movieData.reduce((moviesAtThreate, movie) => {
    const isShowing = !!movie.theaters.find(({ th }) => th === cinemaId);
    if (!isShowing) return moviesAtThreate;

    const overview = {
      duration: movie.runtime ? parseMinsToMs(movie.runtime / 60) : undefined,
      categories: convertToList(movie.genres),
      actors: movie.casting,
      directors: movie.direction.concat(movie.coDirection),
    };

    if (movie.certificate && !movie.certificate.includes("TBC")) {
      overview.certification = movie.certificate;
    }

    if (movie.trailer.youtube?.length > 0) {
      overview.trailer = movie.trailer.youtube[0];
    }

    moviesAtThreate[movie.id] = {
      title: movie.title,
      url: `${domain}${movie.path}`,
      overview,
    };
    return moviesAtThreate;
  }, {});

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return Object.keys(movieListPage)
    .map((movieId) => {
      const performances = Object.values(movieListPage[movieId]).flatMap(
        (dayPerformances) => dayPerformances,
      );
      return {
        ...movies[movieId],
        performances: performances.map((performance) => {
          let notes = "";
          if (performance.occupancy.rate === 100) {
            notes += "\nSold out";
          } else {
            notes += `\n${performance.occupancy.rate}% of seats sold`;
          }
          notes += performance.tags.reduce((tagNotes, tag) => {
            if (tag !== "Format.Projection.Digital") {
              const tagData = attributeData.find(
                ({ id }) => id === `${cinemaId}_${tag}`,
              );
              if (tagData) {
                return `${tagNotes}\n${tagData.localizations[0].description}`;
              }
            }
            return tagNotes;
          }, "");

          return {
            time: new Date(performance.startsAt).getTime(),
            notes: notes.trim(),
            bookingUrl: performance.data.ticketing[0].urls[0],
          };
        }),
      };
    })
    .concat(listOfSourcedEvents);
}

module.exports = transform;
