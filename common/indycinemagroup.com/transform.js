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
  122: "Ludski Bar", // riocinema.org.uk
  318: "1", // phoenixcinema.co.uk
  317: "2", // phoenixcinema.co.uk
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
    // If there are duplicate showings at the same time, take the last. This
    // fixes the issue where an invalid showing has been left in and replaced.
    const showings = Object.values(
      movie.showings.reduce(
        (mapping, showing) => ({
          ...mapping,
          [showing.time]: showing,
        }),
        {},
      ),
    ).sort((a, b) => a > b);

    const isActorsPlaceholder = movie.starring
      ?.toLowerCase()
      ?.startsWith("cast to be announced");
    const actors = isActorsPlaceholder
      ? []
      : splitConjoinedItemsInList(convertToList(movie.starring));
    const transformedMovie = {
      title: movie.name,
      url: `${domain}/movie/${movie.urlSlug}`,
      overview: {
        categories: convertToList(movie.allGenres),
        duration: parseMinsToMs(movie.duration),
        directors: splitConjoinedItemsInList(convertToList(movie.directedBy)),
        actors,
      },
      performances: filterHistoricalPerformances(
        showings.map((showing) => {
          const date = parseISO(showing.time);
          let notes = `${showing.seatsRemaining} of ${showing.seatsRemaining + showing.ticketsSold} seats remaining`;
          const tags = JSON.parse(showing.displayMetaData)
            .classes.split(" ")
            .map((tag) => tag.trim());
          if (tags.includes("cc")) {
            notes += "\nClosed Captioned screening for Hard of Hearing";
          }
          if (tags.includes("no-trailers-or-adverts")) {
            notes += "\nNo adverts or trailers";
          }
          return {
            time: date.getTime(),
            screen: screenMapping[showing.screenId] || showing.screenId,
            notes,
            bookingUrl: `${domain}/checkout/showing/${movie.urlSlug}/${showing.id}`,
          };
        }),
      ),
    };

    if (movie.trailerYoutubeId) {
      transformedMovie.overview.trailer = `https://www.youtube.com/watch?v=${movie.trailerYoutubeId}`;
    }

    if (movie.rating && movie.rating !== "TBC") {
      transformedMovie.overview.certification = movie.rating;
    }

    return moviesAtCinema.concat([transformedMovie]);
  }, []);
}

module.exports = transform;
