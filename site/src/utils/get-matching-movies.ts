import {
  type MoviePerformance,
  type Movie,
  type Filters,
  type CinemaData,
} from "@/types";
import getMovieCertification from "./get-movie-certification";
import normalizeString from "./normalize-string";

const getMatchingMovies = (
  movies: CinemaData["movies"],
  {
    searchTerm,
    dateRange,
    filteredVenues,
    filteredMovies,
    filteredCertifications,
    filteredGenres,
    yearRange,
    includeUnknownYears,
  }: Filters,
) => {
  const sortedMovies = Object.keys(movies)
    .map((id) => movies[id])
    .sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

  return sortedMovies.reduce((matchingMovies, movie) => {
    if (
      searchTerm &&
      !normalizeString(movie.title).includes(normalizeString(searchTerm))
    ) {
      return matchingMovies;
    }

    if (!filteredMovies[movie.id]) {
      return matchingMovies;
    }

    if (!filteredCertifications[getMovieCertification(movie)]) {
      return matchingMovies;
    }

    if (
      movie.genres &&
      movie.genres.length > 0 &&
      !movie.genres?.some((genre) => filteredGenres[genre])
    ) {
      return matchingMovies;
    }

    if (movie.year) {
      const year = parseInt(movie.year, 10);
      if (year > yearRange.max || year < yearRange.min) {
        return matchingMovies;
      }
    } else {
      if (!includeUnknownYears) {
        return matchingMovies;
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
      matchingMovies.push({ ...movie, performances });
    }

    return matchingMovies;
  }, [] as Movie[]);
};

export default getMatchingMovies;
