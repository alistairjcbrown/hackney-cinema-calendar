const { writeFileSync } = require("node:fs");
const path = require("node:path");
const { nanoid } = require("nanoid");
const { compress, trimUndefinedRecursively } = require("compress-json");
const getSites = require("../common/get-sites");
const normalizeTitle = require("../common/normalize-title");
const { getMovieInfoAndCacheResults } = require("../common/get-movie-data");
const { parseMinsToMs } = require("../common/utils");

const getId = () => nanoid(8);

const getCertification = ({ release_dates: { results } }) => {
  const result = results.find(({ iso_3166_1: locale }) => locale === "GB");
  if (!result) return undefined;

  const { release_dates: releaseDates } = result;
  const releaseDateWithCertification = releaseDates.find(
    ({ certification }) => !!certification,
  );

  if (!releaseDateWithCertification) return undefined;
  return releaseDateWithCertification.certification;
};

const getDirectors = ({ credits: { crew } }) =>
  crew
    .filter(({ job }) => job.toLowerCase() === "director")
    .map(({ id, name }) => ({ id, name }));

const getActors = ({ credits: { cast } }) =>
  cast
    .slice(0, 10)
    .filter(({ popularity }) => popularity >= 5)
    .map(({ id, name }) => ({ id, name }));

const getGenres = ({ genres }) => genres;

const getYoutubeTrailer = ({ videos: { results } }) => {
  const trailer = results.find(
    ({ type, site }) =>
      type.toLowerCase() === "trailer" && site.toLowerCase() === "youtube",
  );
  return trailer ? trailer.key : undefined;
};

const getImddId = ({ external_ids: externalIds = {} }) => externalIds.imdb_id;

const data = getSites().reduce((mapping, site) => {
  let attributes;
  let shows;
  try {
    attributes = require(
      path.join(__dirname, "..", "cinemas", `${site}`, "attributes.js"),
    );
    shows = require(path.join(__dirname, "..", "output", `${site}-shows.json`));
  } catch (e) {
    return mapping;
  }
  return { ...mapping, [site]: { attributes, shows } };
}, {});

const siteData = {
  venues: {},
  people: {},
  genres: {},
  movies: {},
};

(async function () {
  for (cinema in data) {
    console.log(`[🎞️  Cinema: ${cinema}]`);
    const venueId = getId();
    const {
      attributes: { name, url, address, geo },
      shows,
    } = data[cinema];

    siteData.venues[venueId] = {
      id: venueId,
      name,
      url,
      address,
      geo,
    };

    for (show of shows) {
      const { title, url, overview, performances, moviedb } = show;

      let movieInfo;
      if (moviedb) {
        const outputTitle = title.slice(0, 35);
        process.stdout.write(
          ` - Retriving data for ${outputTitle} ... ${"".padEnd(35 - outputTitle.length, " ")}`,
        );
        try {
          movieInfo = await getMovieInfoAndCacheResults(moviedb);
          console.log(`\t✅ Retrieved`);
        } catch (e) {
          console.log(`\t❌ Error retriving`);
          throw e;
        }
      }

      const movieId = movieInfo ? movieInfo.id : getId();
      if (!siteData.movies[movieId]) {
        if (movieInfo) {
          const directors = getDirectors(movieInfo);
          const actors = getActors(movieInfo);
          const genres = getGenres(movieInfo);

          directors.forEach((crew) => (siteData.people[crew.id] = crew));
          actors.forEach((cast) => (siteData.people[cast.id] = cast));
          genres.forEach((genre) => (siteData.genres[genre.id] = genre));

          siteData.movies[movieId] = {
            id: movieId,
            title: movieInfo.title,
            normalizedTitla: normalizeTitle(movieInfo.title),
            certification: getCertification(movieInfo),
            overview: movieInfo.overview,
            year: movieInfo.release_date.split("-")[0],
            duration: parseMinsToMs(movieInfo.runtime),
            directors: directors.map(({ id }) => id),
            actors: actors.map(({ id }) => id),
            genres: genres.map(({ id }) => id),
            imdbId: getImddId(movieInfo),
            youtubeTrailer: getYoutubeTrailer(movieInfo),
            posterPath: movieInfo.poster_path,
            showings: {},
            performances: [],
          };
        } else {
          siteData.movies[movieId] = {
            id: movieId,
            title: title,
            isUnmatched: true,
            showings: {},
            performances: [],
          };
        }
      }

      const showingId = getId();
      const movie = siteData.movies[movieId];

      movie.showings[showingId] = {
        id: showingId,
        venueId,
        title: title !== movie.title ? title : undefined,
        url,
        overview,
      };

      movie.performances = movie.performances.concat(
        performances.map(({ time, notes, bookingUrl }) => ({
          showingId,
          time,
          notes: notes !== "" ? notes : undefined,
          bookingUrl,
        })),
      );
    }
    console.log(" ");
  }

  process.stdout.write(`Compressing data ...   `);
  try {
    const dataFile = `./output/combined-data.json`;
    trimUndefinedRecursively(siteData);
    const compressed = compress(siteData).toString();
    console.log(`✅ Compressed`);

    writeFileSync(dataFile, compressed);
    console.log(`🗂️  Combined file created`);
  } catch (e) {
    console.log(`\t❌ Error compressing`);
    throw e;
  }
})();
