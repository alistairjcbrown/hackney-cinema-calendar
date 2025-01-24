const cheerio = require("cheerio");
const slugify = require("slugify");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { parseMinsToMs, convertToList } = require("../utils");

function extractData(value) {
  const $ = cheerio.load(value);
  const data = {};
  $(".directorDiv .directorInner").each(function () {
    const key = $(this).text().toLowerCase().replace(":", "").trim();
    if (key === "director") {
      data.directors = convertToList($(this).next().text());
    }
    if (key === "starring") {
      data.actors = convertToList($(this).next().text());
    }
  });
  return data;
}

async function transform(
  { domain, cinemaId },
  { movieListPage: { movies }, moviePages },
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

      const additionalData = extractData(moviePages[movie.ScheduledFilmId]);
      const overview = {
        categories: [],
        directors: additionalData.directors || [],
        actors: additionalData.actors || [],
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
        performances: showings.map((showing) => {
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
      };
      return moviesAtCinema.concat([transformedMovie]);
    }, [])
    .concat(listOfSourcedEvents);
}

module.exports = transform;
