const { parseISO } = require("date-fns");
const { createOverview, createPerformance } = require("../../common/utils");

async function transform(
  { domain, cinemaId },
  { movieListPage, moviePages: { movieData, attributeData } },
  sourcedEvents,
) {
  const movies = movieData.reduce((moviesAtThreate, movie) => {
    const isShowing = !!movie.theaters.find(({ th }) => th === cinemaId);
    if (!isShowing) return moviesAtThreate;

    if (!movieListPage[movie.id]) return moviesAtThreate;

    const overview = createOverview({
      duration: movie.runtime ? movie.runtime / 60 : undefined,
      categories: movie.genres,
      actors: movie.casting,
      directors: movie.direction.concat(movie.coDirection),
      certification: movie.certificate,
      trailer: movie.trailer.youtube?.[0],
    });

    const performances = Object.values(movieListPage[movie.id])
      .flatMap((dayPerformances) => dayPerformances)
      .map((performance) => {
        let notesList = [];
        if (performance.occupancy.rate === 100) {
          notesList.push("Sold out");
        } else {
          notesList.push(`${performance.occupancy.rate}% of seats sold`);
        }
        notesList = notesList.concat(
          performance.tags.reduce((tagNotes, tag) => {
            if (tag === "Format.Projection.Digital") return tagNotes;
            const tagId = `${cinemaId}_${tag}`;
            const tagData = attributeData.find(({ id }) => id === tagId);
            if (tagData) {
              return tagNotes.concat(tagData.localizations[0].description);
            }
          }, []),
        );

        return createPerformance({
          date: parseISO(performance.startsAt),
          notesList,
          url: performance.data.ticketing[0].urls[0],
        });
      });

    return moviesAtThreate.concat({
      title: movie.title,
      url: `${domain}${movie.path}`,
      overview,
      performances,
    });
  }, []);

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
