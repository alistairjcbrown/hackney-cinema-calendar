const cheerio = require("cheerio");
const { convertToList } = require("../utils");
const { dailyCache } = require("../cache");

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

async function retrieve({ domain, cinemaId }) {
  const variables = {
    start_date: "show_all_dates",
    cinema_id: cinemaId,
  };

  const moviesResponse = await fetch(`${domain}/api/get-movies-ajax`, {
    method: "POST",
    body: new URLSearchParams(variables).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
  const { movies } = await moviesResponse.json();

  const additionalData = {};
  const moviesIdsAtCinema = movies.reduce((list, movie) => {
    const showings = movie.show_times.filter(
      (showing) => showing.CinemaId === cinemaId,
    );
    return showings.length === 0 ? list : list.concat(movie.ScheduledFilmId);
  }, []);

  for (movieId of moviesIdsAtCinema) {
    const additionalFilmData = await dailyCache(
      `picturehouse.com-info-${movieId}`,
      async () => {
        const url = `${domain}/movie-details/${cinemaId}/${movieId}/-`;
        return (await fetch(url)).text();
      },
    );
    additionalData[movieId] = extractData(additionalFilmData);
  }

  return { movies, additionalData };
}

module.exports = retrieve;
