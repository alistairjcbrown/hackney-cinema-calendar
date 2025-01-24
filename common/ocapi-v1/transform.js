const slugify = require("slugify");
const { createPerformance, createOverview } = require("../../common/utils");

const findFor = (list, idMatch) => list.find(({ id }) => id === idMatch);

async function transform(
  { domain },
  showtimeDays,
  { getBookingUrl },
  sourcedEvents,
) {
  const movies = showtimeDays.reduce(
    (
      mapping,
      { relatedData: { sites, films, censorRatings, genres, castAndCrew } },
    ) =>
      films.reduce((mappedFilms, film) => {
        if (mappedFilms[film.id]) return mappedFilms;

        const findByRole = (role) => (group, member) => {
          if (!member.roles.includes(role)) return group;

          const match = findFor(castAndCrew, member.castAndCrewMemberId);
          if (!match) return group;

          const {
            name: { givenName, familyName },
          } = match;
          return group.concat(`${givenName.trim()} ${familyName.trim()}`);
        };

        const certification = findFor(censorRatings, film.censorRatingId)
          ?.classification?.text;

        const overview = createOverview({
          duration: film.runtimeInMinutes,
          categories: film.genreIds.map(
            (genreId) => findFor(genres, genreId).name.text,
          ),
          directors: film.castAndCrew.reduce(findByRole("Director"), []),
          actors: film.castAndCrew.reduce(findByRole("Actor"), []),
          certification,
          trailer: film.trailerUrl,
        });

        const slug = slugify(film.title.text, { strict: true }).toLowerCase();
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

        const notesList = [];
        if (performance.isSoldOut) {
          notesList.push("Sold out");
        }
        if (performance.requires3dGlasses) {
          notesList.push("Requires 3D glasses");
        }
        performance.attributeIds.forEach((attributeId) => {
          const attribute = findFor(attributes, attributeId);
          if (attribute) {
            if (!attribute.description?.text) {
              notesList.push(`${attribute.name.text}`);
            } else {
              notesList.push(
                `${attribute.name.text}: ${attribute.description.text}`,
              );
            }
          }
        });

        movie.performances = movie.performances.concat(
          createPerformance({
            date: new Date(schedule.startsAt),
            screen: findFor(screens, screenId).name.text,
            notesList,
            url: getBookingUrl(performance),
          }),
        );
      });
    },
  );

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );

  return Object.values(movies).concat(listOfSourcedEvents);
}

module.exports = transform;
