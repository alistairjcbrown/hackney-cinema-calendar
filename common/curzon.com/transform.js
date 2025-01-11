const slugify = require("slugify");
const {
  filterHistoricalPerformances,
  parseMinsToMs,
} = require("../../common/utils");

async function transform({ domain }, showtimeDays) {
  const movies = showtimeDays.reduce(
    (
      mapping,
      { relatedData: { sites, films, censorRatings, genres, castAndCrew } },
    ) =>
      films.reduce((mappedFilms, film) => {
        if (mappedFilms[film.id]) return mappedFilms;

        const findByRole = (role) => (group, member) => {
          if (!member.roles.includes(role)) return group;
          const match = castAndCrew.find(
            ({ id }) => id === member.castAndCrewMemberId,
          );
          if (!match) return group;
          const {
            name: { givenName, familyName },
          } = match;
          return group.concat(`${givenName.trim()} ${familyName.trim()}`);
        };

        const slug = slugify(film.title.text, { strict: true }).toLowerCase();

        const overview = {
          duration: film.runtimeInMinutes
            ? parseMinsToMs(film.runtimeInMinutes)
            : undefined,
          categories: film.genreIds.map(
            (genreId) => genres.find(({ id }) => id === genreId).name.text,
          ),
          directors: film.castAndCrew.reduce(findByRole("Director"), []),
          actors: film.castAndCrew.reduce(findByRole("Actor"), []),
        };

        const certification = censorRatings.find(
          ({ id }) => id === film.censorRatingId,
        )?.classification?.text;
        if (certification && !certification.includes("TBC")) {
          overview.certification = certification;
        }

        if (film.trailerUrl) {
          overview.trailer = film.trailerUrl;
        }

        return {
          ...mappedFilms,
          [film.id]: {
            title: film.title.text,
            url: `${domain}/films/${slug}/${film.id}/?siteId=${sites[0].id}`,
            overview,
            performances: [],
          },
        };
      }, mapping),
    {},
  );

  showtimeDays.forEach(
    ({ showtimes, relatedData: { screens, attributes } }) => {
      showtimes.forEach((performance) => {
        const { screenId, schedule } = performance;
        const movie = movies[performance.filmId];

        let notes = "";
        if (performance.isSoldOut) notes += "\nSold out";
        if (performance.requires3dGlasses) notes += "\nRequires 3D glasses";
        performance.attributeIds.forEach((attributeId) => {
          const attribute = attributes.find(({ id }) => id === attributeId);
          if (attribute) {
            notes += `\n${attribute.shortName.text}: ${attribute.description.text}`;
          }
        });

        const screen = screens.find(({ id }) => id === screenId).name.text;

        movie.performances = movie.performances.concat({
          time: new Date(schedule.startsAt).getTime(),
          screen,
          notes: notes.trim(),
          bookingUrl: `https://www.curzon.com/ticketing/seats/${performance.id}/`,
        });
      });
    },
  );

  return Object.values(movies).map((movie) => ({
    ...movie,
    performances: filterHistoricalPerformances(movie.performances),
  }));
}

module.exports = transform;
