"use client";
import { FavouriteMovie, Movie, MoviePerformance } from "@/types";
import Link from "next/link";
import { isAfter } from "date-fns";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Heading from "rsuite/cjs/Heading";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import { useCinemaData } from "@/state/cinema-data-context";
import getMoviePath from "@/utils/get-movie-path";
import showNumber from "@/utils/show-number";
import AppHeading from "@/components/app-heading";
import { useUserSettings } from "@/state/user-settings-context";
import bestMoviesFilter from "@/components/app-heading/best-movies-filter";
import showTimeToNextPerformance from "@/components/movie-item/show-time-to-next-performance";
import ExternalLink from "@/components/external-link";
import FavouriteMovieButton from "@/components/favourite-movie-button";
import FilterLink from "@/components/filter-link";

function sortByTitle<T extends Omit<FavouriteMovie, "addedOn">>(
  list: T[],
): T[] {
  return list.sort((a, b) => a.title.localeCompare(b.title));
}

function filterForFuturePerformances(
  performances: MoviePerformance[],
): MoviePerformance[] {
  return performances
    .filter(({ time }) => isAfter(time, new Date()))
    .sort((a, b) => a.time - b.time);
}

export default function FavouritesContent() {
  const { data } = useCinemaData();
  const { favouriteMovies } = useUserSettings();
  const matchedMovies = Object.values(data!.movies).filter(
    ({ isUnmatched }) => !isUnmatched,
  );
  const randomIndex = Math.floor(Math.random() * matchedMovies.length);
  const randomMovie = matchedMovies[randomIndex];

  const { availableMovies, unavailableMovies } = favouriteMovies.reduce(
    (movieGroups, movie) => {
      const movieMatch = data!.movies[movie.id];
      if (movieMatch) {
        if (filterForFuturePerformances(movieMatch.performances).length > 0) {
          movieGroups.availableMovies.push(movieMatch);
        } else {
          movieGroups.unavailableMovies.push(movie);
        }
      } else {
        movieGroups.unavailableMovies.push(movie);
      }
      return movieGroups;
    },
    {
      availableMovies: [] as Movie[],
      unavailableMovies: [] as FavouriteMovie[],
    },
  );

  return (
    <Container>
      <AppHeading />
      <Content style={{ padding: "1rem" }}>
        <Stack spacing={18} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>Favourites</Heading>
          </Stack.Item>
          {favouriteMovies.length === 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>No Movies Favourited</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  You haven&apos;t favourited any movies, so there&apos;s
                  nothing to see here! 🙈
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  <strong>Want some inspiration?</strong>
                </Text>
                <ul>
                  <li>
                    Take a look at the{" "}
                    <FilterLink filters={{ filteredMovies: bestMoviesFilter }}>
                      🍅 Best Movies
                    </FilterLink>{" "}
                    which filters for any movie from the Rotten Tomatoes{" "}
                    <ExternalLink href="https://editorial.rottentomatoes.com/guide/best-movies-of-all-time/">
                      300 Best Movies of All Time
                    </ExternalLink>
                    .
                  </li>
                  <li>
                    Or{" "}
                    <Link href={getMoviePath(randomMovie)}>
                      try your luck with a randomly selected movie
                    </Link>
                    !
                  </li>
                </ul>
              </Stack.Item>
            </>
          ) : null}
          {availableMovies.length > 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>Movie Opportunities 🎉</Heading>
              </Stack.Item>
              <Stack.Item>
                <ol>
                  {sortByTitle<Movie>(availableMovies).map((movie) => {
                    const performances = filterForFuturePerformances(
                      movie.performances,
                    );

                    return (
                      <li key={movie.id}>
                        <FavouriteMovieButton
                          style={{ marginTop: "-2px" }}
                          movie={movie}
                          small
                        />
                        &nbsp;{" "}
                        <Link href={getMoviePath(movie)}>
                          {movie.title} {movie.year ? `(${movie.year})` : ""}
                        </Link>
                        <ul>
                          <li>
                            {performances.length === 1
                              ? `${performances.length} performance remaining`
                              : `${showNumber(performances.length)} performances remaining`}{" "}
                            &mdash;{" "}
                            {showTimeToNextPerformance(
                              performances,
                            ).toLowerCase()}
                          </li>
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              </Stack.Item>
            </>
          ) : null}
          {unavailableMovies.length > 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>Missed Movies 😱</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  The following movies no longer have performances. You can
                  remove them below, or keep them in case this movie is added
                  again in the future.
                </Text>
              </Stack.Item>
              <Stack.Item>
                <ol>
                  {sortByTitle<FavouriteMovie>(unavailableMovies).map(
                    (movie) => {
                      const isMovieDb = /^\d+$/.test(movie.id);
                      return (
                        <li key={movie.id}>
                          <FavouriteMovieButton
                            style={{ marginTop: "-2px" }}
                            movie={movie}
                            small
                          />
                          &nbsp; {movie.title}{" "}
                          {movie.year ? `(${movie.year})` : ""}
                          {isMovieDb ? (
                            <>
                              {" "}
                              &mdash;{" "}
                              <ExternalLink
                                href={`https://www.themoviedb.org/movie/${movie.id}`}
                              >
                                🎬 TheMovieDB
                              </ExternalLink>
                            </>
                          ) : null}
                        </li>
                      );
                    },
                  )}
                </ol>
              </Stack.Item>
            </>
          ) : null}
        </Stack>
      </Content>
    </Container>
  );
}
