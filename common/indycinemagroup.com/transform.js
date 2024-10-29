const { parseISO } = require("date-fns");
const {
  filterHistoricalPerformances,
  convertToList,
  splitConjoinedItemsInList,
  parseMinsToMs,
} = require("../../common/utils");

const screenMapping = {
  115: "1", // riocinema.org.uk
  116: "2", // riocinema.org.uk
  117: "1", // regentstreetcinema.com
};

async function transform(
  { domain },
  {
    data: {
      movies: { data: movies },
    },
  },
) {
  return movies.reduce((moviesAtCinema, movie) => {
    const transformedMovie = {
      title: movie.name,
      url: `${domain}/movie/${movie.urlSlug}`,
      overview: {
        categories: convertToList(movie.allGenres),
        duration: parseMinsToMs(movie.duration),
        directors: splitConjoinedItemsInList(convertToList(movie.directedBy)),
        actors: splitConjoinedItemsInList(convertToList(movie.starring)),
      },
      performances: filterHistoricalPerformances(
        movie.showings.map((showing) => {
          const date = parseISO(showing.time);
          return {
            time: date.getTime(),
            screen: screenMapping[showing.screenId] || showing.screenId,
            notes: `${showing.seatsRemaining} of ${showing.seatsRemaining + showing.ticketsSold} seats remaining`,
            bookingUrl: `${domain}/checkout/showing/${movie.urlSlug}/${showing.id}`,
          };
        }),
      ),
    };

    if (movie.trailerYoutubeId) {
      transformedMovie.overview.trailer = `https://www.youtube.com/watch?v=${movie.trailerYoutubeId}`;
    }

    if (movie.rating) {
      transformedMovie.overview["age-restriction"] = movie.rating;
    }

    return moviesAtCinema.concat([transformedMovie]);
  }, []);
}

module.exports = transform;
