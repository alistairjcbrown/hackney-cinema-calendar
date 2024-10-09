const slugify = require("slugify");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { domain, cinemaId } = require("./attributes");
const { filterHistoricalPerformances, parseMinsToMs } = require("../../utils");

async function transform({ movies }) {
  return movies.reduce((moviesAtCinema, movie) => {
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
      directors: [],
      actors: [],
      duration: parseMinsToMs(movie.RunTime) || parseMinsToMs(90),
    };

    if (movie.Rating) {
      overview["age-restriction"] = movie.Rating;
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
            notes: showing.attributes
              .map(
                ({ attribute_full: title, description }) =>
                  `${title}: ${description}`,
              )
              .join("\n"),
            bookingUrl: `https://ticketing.picturehouses.com/Ticketing/visSelectTickets.aspx?cinemacode=${cinemaId}&txtSessionId=${showing.SessionId}&visLang=1`,
          };
        }),
      ),
    };
    return moviesAtCinema.concat([transformedMovie]);
  }, []);
}

module.exports = transform;
