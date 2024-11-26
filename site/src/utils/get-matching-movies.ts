import type { MoviePerformance, Movie, Filters, CinemaData } from "@/types";

const getMatchingMovies = (
  movies: CinemaData["movies"],
  {
    searchTerm,
    dateRange,
    filteredVenues,
    filteredGenres,
    yearRange,
    includeUnknownYears,
  }: Filters,
) => {
  const sortedMovies = Object.keys(movies)
    .map((id) => movies[id])
    .sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

  return sortedMovies.reduce((filteredMovies, movie) => {
    if (
      searchTerm &&
      !movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return filteredMovies;
    }

    if (
      movie.genres &&
      movie.genres.length > 0 &&
      !movie.genres?.some((genre) => filteredGenres[genre])
    ) {
      return filteredMovies;
    }

    if (movie.year) {
      const year = parseInt(movie.year, 10);
      if (year > yearRange.max || year < yearRange.min) {
        return filteredMovies;
      }
    } else {
      if (!includeUnknownYears) {
        return filteredMovies;
      }
    }

    const performances = movie.performances.reduce(
      (matchingPerformances, performance) => {
        const { venueId } = movie.showings[performance.showingId];
        if (
          // Performances that are in the expected venues
          filteredVenues[venueId] &&
          // Performances that start in the expected time range (in the future)
          performance.time > Math.max(dateRange.start, Date.now()) &&
          performance.time < dateRange.end
        ) {
          matchingPerformances.push(performance);
        }
        return matchingPerformances;
      },
      [] as MoviePerformance[],
    );
    if (performances.length > 0) {
      filteredMovies.push({ ...movie, performances });
    }

    return filteredMovies;
  }, [] as Movie[]);
};

export default getMatchingMovies;
