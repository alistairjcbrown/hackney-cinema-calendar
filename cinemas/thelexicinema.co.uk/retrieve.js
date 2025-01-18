const { url } = require("./attributes");

async function retrieve() {
  const movieListPage = await (await fetch(url)).text();
  const events = movieListPage.match(
    /<script>\s*var\s+Events\s+=\s+(.*)\s+<\/script>/i,
  );
  return JSON.parse(events[1]);
}

module.exports = retrieve;
