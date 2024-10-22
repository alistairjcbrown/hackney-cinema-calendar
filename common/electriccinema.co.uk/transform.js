const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { parseMinsToMs } = require("../../common/utils");

async function transform(
  { cinemaId, domain },
  { filmData: { films, screenings, screeningTypes } },
) {
  return Object.values(films).reduce((cinemaFilms, film) => {
    const siteFilmScreenings = film.screenings.byCinema[cinemaId];
    if (!siteFilmScreenings) return cinemaFilms;

    const fileUrl = `${domain}${film.link}`;
    const show = {
      title: film.title,
      url: fileUrl,
      overview: {
        year: film.premiere.split("-")[0],
        // No duration data from cinema site, so default all to 90 minutes
        duration: parseMinsToMs(90),
        categories: [],
        directors: [],
        actors: [],
      },
      performances: [],
    };

    if (film.rating && film.rating !== "TBC") {
      show.overview["age-restriction"] = film.rating;
    }

    if (film.director) {
      show.overview.directors.push(film.director);
    }

    const screeningIds = Object.values(siteFilmScreenings).flatMap(
      (screeningIds) => screeningIds,
    );
    show.performances = screeningIds.map((screeningId) => {
      const screening = screenings[screeningId];
      const date = parse(
        `${screening.d}T${screening.t}`,
        "yyyy-MM-dd'T'HH:mm",
        new Date(),
        {
          locale: enGB,
        },
      );

      let notes = "";
      if (screening.st) {
        notes = screeningTypes[screening.st].title;
      }

      const bookingUrl = screening.link
        ? `${domain}${screening.link}`
        : fileUrl;

      return {
        time: date.getTime(),
        screen: screening.sn,
        notes,
        bookingUrl,
      };
    });

    return cinemaFilms.concat(show);
  }, []);
}

module.exports = transform;
