const { domain } = require("./attributes");

async function retrieve() {
  const url = `${domain}/whats-on/cinema/?ajax=1&json=1`;
  const movieListPage = await (await fetch(url)).json();

  const moviePages = {};
  for (movie of movieListPage) {
    const moviePageUrl = `https://richmix.org.uk/cinema/${movie.slug}/`;
    const moviePage = await (await fetch(moviePageUrl)).text();
    moviePages[movie.id] = moviePage;
  }

  return {
    movieListPage,
    moviePages,
  };
}

module.exports = retrieve;
