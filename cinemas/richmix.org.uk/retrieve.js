const { dailyCache } = require("../../common/cache");
const { domain } = require("./attributes");

async function retrieve() {
  const url = `${domain}/whats-on/cinema/?ajax=1&json=1`;
  const movieList = await (await fetch(url)).json();

  const moviePages = {};
  for (movie of movieList) {
    const moviePageUrl = `https://richmix.org.uk/cinema/${movie.slug}/`;
    const moviePage = await dailyCache(
      `richmix.org.uk-info-${movie.id}`,
      async () => (await fetch(moviePageUrl)).text(),
    );
    moviePages[movie.id] = moviePage;
  }

  return {
    movieList,
    moviePages,
  };
}

module.exports = retrieve;
