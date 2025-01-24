const slugify = require("slugify");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const {
  filterHistoricalPerformances,
  parseMinsToMs,
} = require("../../common/utils");

async function transform(
  { domain, cinemaId },
  { movieListPage: { movies }, moviePages: additionalData },
  sourcedEvents,
) {
  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return movies
    .reduce((moviesAtCinema, movie) => {
      const slug = slugify(movie.Title);
      const showings = movie.show_times.filter(
        (showing) => showing.CinemaId === cinemaId,
      );

      if (showings.length === 0) return moviesAtCinema;

      // Remove private hire entries
      if (movie.Title.toLowerCase().startsWith("private hire (")) {
        return moviesAtCinema;
      }

      const overview = {
        categories: [],
        directors: additionalData[movie.ScheduledFilmId]?.directors || [],
        actors: additionalData[movie.ScheduledFilmId]?.actors || [],
        duration: parseMinsToMs(movie.RunTime),
      };

      if (movie.Rating) {
        overview.certification = movie.Rating;
      }
      if (movie.TrailerUrl) {
        overview.trailer = movie.TrailerUrl;
      }

      const transformedMovie = {
        title: movie.Title,
        url: `${domain}/movie-details/${cinemaId}/${movie.ScheduledFilmId}/${slug}`,
        overview,
        performances: filterHistoricalPerformances(
          showings.map((showing) => {
            const date = parse(
              showing.Showtime,
              "yyyy-MM-dd'T'HH:mm:ss",
              new Date(),
              {
                locale: enGB,
              },
            );
            return {
              time: date.getTime(),
              screen: showing.ScreenName.replace("Screen ", ""),
              notes: (showing.attributes || [])
                .map(({ attribute_full: title, description }) => {
                  if (description) return `${title}: ${description}`;
                  return title;
                })
                .join("\n"),
              bookingUrl: `https://ticketing.picturehouses.com/Ticketing/visSelectTickets.aspx?cinemacode=${cinemaId}&txtSessionId=${showing.SessionId}&visLang=1`,
            };
          }),
        ),
      };
      return moviesAtCinema.concat([transformedMovie]);
    }, [])
    .concat(listOfSourcedEvents);
}

module.exports = transform;
