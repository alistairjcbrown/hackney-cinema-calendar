const { writeFileSync } = require("node:fs");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { compress, trimUndefinedRecursively } = require("compress-json");
const getSites = require("../common/get-sites");
const normalizeTitle = require("../common/normalize-title");
const {
  getMovieInfoAndCacheResults,
  getMovieGenresAndCacheResults,
} = require("../common/get-movie-data");
const { parseMinsToMs } = require("../common/utils");

const getId = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 8);

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
    .map(({ id, name }) => ({ id: `${id}`, name }));

const getActors = ({ credits: { cast } }) =>
  cast
    .slice(0, 10)
    .filter(({ popularity }) => popularity >= 5)
    .map(({ id, name }) => ({ id: `${id}`, name }));

const getGenres = ({ genres }) =>
  genres.map(({ id, name }) => ({ id: `${id}`, name }));

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
    const {
      attributes: { name, url, address, geo },
      shows,
    } = data[cinema];
    const venueId = getId(name);

    siteData.venues[venueId] = {
      id: venueId,
      name,
      url,
      address,
      geo,
    };

    const movieGenres = await getMovieGenresAndCacheResults();

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

      const movieId = movieInfo ? `${movieInfo.id}` : getId(title);
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
            normalizedTitle: normalizeTitle(movieInfo.title),
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
            normalizedTitle: normalizeTitle(title),
            isUnmatched: true,
            genres: [],
            showings: {},
            performances: [],
          };
        }
      }

      const showingId = getId(`${venueId}-${title}`);
      const movie = siteData.movies[movieId];

      if (movie.isUnmatched) {
        const matchedGenres = overview.categories.reduce(
          (matchedCategories, name) => {
            const match = movieGenres.genres.find(
              (movieGenre) =>
                movieGenre.name.toLowerCase().trim() ===
                name.toLowerCase().trim(),
            );
            if (match) return [...matchedCategories, match.id];
            return matchedCategories;
          },
          [],
        );

        movie.genres = [...movie.genres, ...matchedGenres];
      }

      movie.showings[showingId] = {
        id: showingId,
        venueId,
        title: title !== movie.title ? title : undefined,
        url,
        overview,
      };

      movie.performances = movie.performances.concat(
        performances.map(({ time, notes, bookingUrl, screen }) => ({
          showingId,
          time,
          notes: notes !== "" ? notes : undefined,
          bookingUrl,
          screen,
        })),
      );
    }

    console.log(" ");
  }

  Object.keys(siteData.movies).forEach((movieId) => {
    const id = getId("uncategorised");
    const movie = siteData.movies[movieId];
    if (movie.genres.length === 0) {
      movie.genres = [id];
      siteData.genres[id] = { id, name: "Uncategorised" };
    }
  });

  const potentialCombinations = Object.values(siteData.movies).reduce(
    (collection, movie) => {
      collection[movie.normalizedTitle] =
        collection[movie.normalizedTitle] || [];
      collection[movie.normalizedTitle].push(movie);
      return collection;
    },
    {},
  );
  const confirmedConbinations = Object.values(potentialCombinations).reduce(
    (combinations, group) => {
      if (group.length <= 1) return combinations;

      // Don't try to combine movies which are already matched
      if (group.filter(({ isUnmatched }) => !isUnmatched).length > 1) {
        return combinations;
      }
      // But if there's only 1, we can combine unmatched ones with it
      return {
        ...combinations,
        [group[0].normalizedTitle]: group,
      };
    },
    {},
  );

  Object.values(confirmedConbinations).forEach((group) => {
    const matched = group.find(({ isUnmatched }) => !isUnmatched);
    const container = { ...(matched || group[0]) };
    group.forEach((movie) => {
      if (movie.id === container.id) return;
      // Add showing title in case it doesn't match container title
      movie.showings = Object.keys(movie.showings).reduce(
        (updatedShowings, showingId) => {
          const showing = movie.showings[showingId];
          if (showing.title || movie.title === container.title) {
            return { ...updatedShowings, [showingId]: showing };
          }
          return {
            ...updatedShowings,
            [showingId]: { ...showing, title: movie.title },
          };
        },
        {},
      );
      // TODO: Merge genres? movie.genres
      container.showings = { ...container.showings, ...movie.showings };
      container.performances = [
        ...container.performances,
        ...movie.performances,
      ];

      delete siteData.movies[movie.id];
    });
    siteData.movies[container.id] = container;
  });

  process.stdout.write(`Compressing data ...   `);
  try {
    const outputPath = "./site/public/"
    const outputFilename = "combined-data.json";
    trimUndefinedRecursively(siteData);
    const compressed = JSON.stringify(compress(siteData));
    console.log(`✅ Compressed`);

    if (!fs.existsSync(outputPath)){
      fs.mkdirSync(outputPath, { recursive: true });
    }
    writeFileSync(`${outputPath}${outputFilename}`, compressed);
    console.log(`🗂️  Combined file created`);
  } catch (e) {
    console.log(`\t❌ Error creating combined file`);
    throw e;
  }
})();
