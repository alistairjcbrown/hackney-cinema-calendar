import type { Movie, Filters } from "@/types";
import { memo, useMemo } from "react";
import Link from "next/link";
import slugify from "@sindresorhus/slugify";
import { useCinemaData } from "@/state/cinema-data-context";
import getMatchingMovies from "@/utils/get-matching-movies";
import MovieItem from "@/components/movie-item";
import "./index.scss";

function MovieItemLink({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movies/${movie.id}/${slugify(movie.title)}`}
      className="movie-item-wrapper"
    >
      <MovieItem movie={movie} />
    </Link>
  );
}

const MovieList = memo(function MovieList({ filters }: { filters: Filters }) {
  const { data } = useCinemaData();
  const movies = useMemo(
    () => getMatchingMovies(data!.movies, filters),
    [data, filters],
  );

  return (
    <ol className="movie-list">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieItemLink movie={movie} />
        </li>
      ))}
    </ol>
  );
});

export default MovieList;
