const cheerio = require("cheerio");
const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const { parseMinsToMs, convertToList } = require("../../common/utils");
const { domain } = require("./attributes");

async function transform({ movieListPage, moviePages }, sourcedEvents) {
  const movies = movieListPage.reduce((moviesWithPerformances, movie) => {
    const performances = Object.values(movie.spektrix_data.instances).flatMap(
      (value) => value,
    );
    if (performances.length === 0) return moviesWithPerformances;

    const $ = cheerio.load(moviePages[movie.id]);

    const $director = $(".crew .director");
    $director.children().each(function () {
      $(this).remove();
    });
    let directors = convertToList($director.text().trim());
    if (directors.length === 0) {
      const movieBlurb = $(".article-body").text().trim();
      const directsMatch = movieBlurb.match(
        /\s+(\w+\s+\w+)\s+\([^)]+\)\s+directs\s+/i,
      );
      if (directsMatch) {
        directors = convertToList(directsMatch[1]);
      }
    }

    const $cast = $(".crew .cast");
    $cast.children().each(function () {
      $(this).remove();
    });
    const actors = convertToList($cast.text().trim());

    return moviesWithPerformances.concat([
      {
        title: movie.post_title,
        url: `${domain}/cinema/${movie.slug}/`,
        overview: {
          duration: parseMinsToMs(movie.spektrix_data.duration),
          certification: movie.spektrix_data.rating,
          categories: [],
          directors,
          actors,
        },
        performances: performances.map(({ start, status, iframeId }) => {
          const date = parse(start, "yyyy-MM-dd HH:mm:ss", new Date(), {
            locale: enGB,
          });

          let notes = `${status.available} of ${status.capacity} seats remaining`;
          const isSoldOut = $(
            `#dates-and-times a[href="/book-online/${iframeId}"]`,
          ).hasClass("sold-out");
          if (isSoldOut) notes += "\nSold out";

          return {
            time: date.getTime(),
            notes,
            bookingUrl: `${domain}/book-online/${iframeId}`,
            screen: status.name
              .toLowerCase()
              .replace("screen", "")
              .replace("(unreserved)", "")
              .trim(),
          };
        }),
      },
    ]);
  }, []);

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
