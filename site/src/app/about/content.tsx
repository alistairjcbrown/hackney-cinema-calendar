"use client";
import {
  Certification,
  certificationOrder,
  type CinemaData,
  type Movie,
  type Filters,
} from "@/types";
import { ComponentProps } from "react";
import { formatDuration, intervalToDuration, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Heading from "rsuite/cjs/Heading";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import Divider from "rsuite/cjs/Divider";
import { useFilters } from "@/state/filters-context";
import AppHeading from "@/components/app-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import getMovieCertification from "@/utils/get-movie-certification";
import MovieCertification from "@/components/movie-certification";
import logo from "./blue_long_1-8ba2ac31f354005783fab473602c34c3f4fd207150182061e425d366e4f34596.svg";
import slugify from "@sindresorhus/slugify";
import getMatchingMovies from "@/utils/get-matching-movies";

const convertToMapping = (values: string[]) =>
  values.reduce((mapping, value) => ({ ...mapping, [value]: true }), {});

const getMoviePath = ({ id, title }: Movie) =>
  `/movies/${id}/${slugify(title)}`;

const getMoviesShowingAt = (venueId: string, movies: CinemaData["movies"]) => {
  return Object.values(movies)
    .filter(({ performances, showings }) =>
      performances.some(
        ({ showingId }) => showings[showingId].venueId == venueId,
      ),
    )
    .map(({ id }) => id);
};

const filterUnmatched = (matches: string[]) => (movies: CinemaData["movies"]) =>
  Object.values(movies)
    .filter(
      ({ title, isUnmatched }) =>
        isUnmatched &&
        matches.some((match) =>
          title.toLowerCase().includes(match.toLowerCase()),
        ),
    )
    .map(({ id }) => id);
const getFestivalShowings = filterUnmatched([
  "LSFF",
  "LSSF",
  "Festival",
  "Fest",
  "Awards",
]);
const getMarathons = filterUnmatched([
  "Trilogy",
  "Marathon",
  "Double",
  "Variety",
]);
const getPremiere = filterUnmatched(["Premier", "Preview"]);

const getMatchedMoviesCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ isUnmatched }) => !isUnmatched).length;

const getMovieCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).length;

const getPerformanceCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (total: number, movie: Movie) => total + movie.performances.length,
    0,
  );

const getVenueCount = (venues: CinemaData["venues"]) =>
  Object.values(venues).length;

const getCertificationCounts = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (totals: Record<Certification, number>, movie: Movie) => {
      const certification = getMovieCertification(movie);
      return {
        ...totals,
        [certification]: (totals[certification] || 0) + 1,
      };
    },
    {} as Record<Certification, number>,
  );

const showNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

const ExternalLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} rel="noreferrer" target="_blank" />
);

type FilterLinkProps = {
  filters: Partial<Filters>;
} & Partial<ComponentProps<typeof Link>>;

const FilterLink = ({ filters, ...props }: FilterLinkProps) => {
  const { setFilters, defaultFilters } = useFilters();
  const router = useRouter();
  return (
    <Link
      {...props}
      href="/"
      onClick={(e) => {
        e.preventDefault();
        const params = setFilters({ ...defaultFilters!, ...filters });
        router.push(`/?${params}`);
      }}
    />
  );
};

const releaseForMovie = (
  date: string,
  format = ["years", "months", "weeks", "days", "hours", "minutes"],
) => {
  const start = parseISO(date);
  const end = new Date();

  let duration = intervalToDuration({ start, end });
  const key = Object.keys(duration)[0] as keyof Duration;
  const isInTheFuture = duration[key]! < 0;
  if (isInTheFuture) duration = intervalToDuration({ start: end, end: start });

  const formatted = formatDuration(duration, { format, delimiter: ", " });
  if (formatted === "") return " now";

  const prefix = isInTheFuture ? "being released in" : "released";
  const suffix = isInTheFuture ? "" : "ago";
  return `${prefix} ${formatted} ${suffix}`.trim();
};

export default function AboutContent() {
  const { data } = useCinemaData();
  const { defaultFilters } = useFilters();
  const start = parseISO(data!.generatedAt);
  const dateDuration = intervalToDuration({ start, end: new Date() });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["years", "months", "weeks", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  const movieCount = getMovieCount(data!.movies);
  const certificationTotals = getCertificationCounts(data!.movies);
  const festivalShowings = getFestivalShowings(data!.movies);
  const marathons = getMarathons(data!.movies);
  const premieres = getPremiere(data!.movies);
  const filmsOrderedByYear = Object.values(data!.movies)
    .filter(({ releaseDate }) => !!releaseDate)
    .sort(
      (a, b) =>
        parseISO(a.releaseDate!).getTime() - parseISO(b.releaseDate!).getTime(),
    );
  const oldestMovie = filmsOrderedByYear[0];
  const newestMovie = filmsOrderedByYear[filmsOrderedByYear.length - 1];
  const matchingMovies = getMatchingMovies(data!.movies, defaultFilters!);
  const moviesWithoutPerformances = Object.values(
    matchingMovies.reduce(
      (movies, { id }) => {
        delete movies[id];
        return movies;
      },
      { ...data!.movies },
    ),
  );
  return (
    <Container>
      <Head>
        <title>London Cinema Movies - About</title>
      </Head>
      <AppHeading />
      <Content style={{ padding: "1rem" }}>
        <Stack spacing={12} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>General Info</Heading>
          </Stack.Item>
          <Stack.Item>
            <Text>
              This site uses data retrieved{" "}
              <strong>
                <time dateTime={data!.generatedAt}>
                  {formattedDuration ? `${formattedDuration} ago` : "just now"}
                </time>
              </strong>{" "}
              from <strong>{showNumber(getVenueCount(data!.venues))}</strong>{" "}
              venues, showing{" "}
              <strong>{showNumber(getPerformanceCount(data!.movies))}</strong>{" "}
              performances of <strong>{showNumber(movieCount)}</strong> movies.
            </Text>
            <Text>
              Of these, we were able to match{" "}
              <strong>
                {Math.round(
                  (getMatchedMoviesCount(data!.movies) / movieCount) * 100,
                )}
                %
              </strong>{" "}
              ({showNumber(getMatchedMoviesCount(data!.movies))}) with{" "}
              <ExternalLink href="https://www.themoviedb.org">
                The Movie Database (TMDB)
              </ExternalLink>
              . The remaining unmatched events include{" "}
              <FilterLink
                filters={{ filteredMovies: convertToMapping(festivalShowings) }}
              >
                {showNumber(festivalShowings.length)} festival showings
              </FilterLink>
              ,{" "}
              <FilterLink
                filters={{ filteredMovies: convertToMapping(marathons) }}
              >
                {showNumber(marathons.length)} movie marathons
              </FilterLink>
              , and{" "}
              <FilterLink
                filters={{ filteredMovies: convertToMapping(premieres) }}
              >
                {showNumber(premieres.length)} premieres
              </FilterLink>
              .
            </Text>
          </Stack.Item>
          <Stack.Item>
            <Text>
              The oldest movie is{" "}
              <Link href={getMoviePath(oldestMovie)}>
                {oldestMovie.title} ({oldestMovie.year})
              </Link>{" "}
              &mdash; {releaseForMovie(oldestMovie.releaseDate!, ["years"])}
            </Text>
            <Text>
              The newest movie is{" "}
              <Link href={getMoviePath(newestMovie)}>
                {newestMovie.title} ({newestMovie.year})
              </Link>{" "}
              &mdash;{" "}
              {releaseForMovie(newestMovie.releaseDate!, [
                "years",
                "months",
                "weeks",
                "days",
              ])}
            </Text>
          </Stack.Item>
          <Stack.Item>
            <details>
              <Text
                as="summary"
                style={{
                  cursor: "pointer",
                  borderRadius: 5,
                  backgroundColor: "var(--rs-violet-50)",
                  padding: "0.5rem",
                }}
              >
                From the movies retrieved,{" "}
                <strong>{showNumber(moviesWithoutPerformances.length)}</strong>{" "}
                have now shown all of their performances and are no longer
                available to see (don&apos;t worry, there&apos;s still{" "}
                <strong>
                  {showNumber(movieCount - moviesWithoutPerformances.length)}
                </strong>{" "}
                to pick from!)
              </Text>
              <ol>
                {moviesWithoutPerformances.map((movie) => (
                  <li key={movie.id}>
                    <Link href={getMoviePath(movie)}>
                      {movie.title} {movie.year ? `(${movie.year})` : ""}
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          </Stack.Item>
          <Stack.Item>
            <Text>The spread of classifications for these films is:</Text>
            <ul>
              {certificationOrder.map((certification) => (
                <li key={certification}>
                  {certification === Certification.Unknown ? (
                    <span
                      style={{
                        textAlign: "center",
                        display: "inline-block",
                        margin: "0.25rem 0.5rem 0.25rem 0",
                        width: 25,
                        height: 25,
                      }}
                    >
                      ❓
                    </span>
                  ) : (
                    <MovieCertification
                      certification={certification}
                      width={25}
                      height={25}
                      style={{ margin: "0.25rem 0.5rem 0.25rem 0" }}
                    />
                  )}
                  {certificationTotals[certification]} movies (
                  {Math.round(
                    (certificationTotals[certification] / movieCount) * 100,
                  )}
                  %)
                </li>
              ))}
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Text>
              The code for powering this site, including retrieving performances
              from venue sites and matching against TMDB API is{" "}
              <ExternalLink href="https://github.com/alistairjcbrown/hackney-cinema-calendar">
                available on Github
              </ExternalLink>
            </Text>
            <Text>
              Data is refreshed early every morning, and available in normalized
              form in a JSON file per venue. This data is also available in a
              ICS calendar file per venue. Releases are made on Github after
              each run,{" "}
              <ExternalLink href="https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest">
                see the latest release
              </ExternalLink>
              .
            </Text>
          </Stack.Item>
          <Stack.Item>
            <Text>
              ⚠️ Please make sure to consult the venue listing page before
              planning attendance or booking tickets for any performance. There
              may be inaccuracies in the data presented and it is sometimes
              possible that the wrong movie has been matched, with the wrong
              details therefore shown.
            </Text>
            <Text>
              🐞 If you do see any issues or bugs with the data or this site,
              please let us know by logging an issue at{" "}
              <ExternalLink href="https://github.com/alistairjcbrown/hackney-cinema-calendar/issues">
                https://github.com/alistairjcbrown/hackney-cinema-calendar/issues
              </ExternalLink>
            </Text>
          </Stack.Item>
        </Stack>
        <Divider />
        <Stack spacing={24} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>Sources</Heading>
          </Stack.Item>
          <Stack.Item>
            <Stack spacing={12} direction="column" alignItems="flex-start">
              <Stack.Item>
                <Heading level={5}>Source of Movie Data</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  Using the data gathered from each venue website, we attempt to
                  match to an entry in{" "}
                  <ExternalLink href="https://www.themoviedb.org">
                    The Movie Database (TMDB)
                  </ExternalLink>
                  . This gives us richer information about the movie, including
                  poster image, associated genres, cast & crew details, etc.
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  This API is graciously provided for free with attribution:
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text
                  as="blockquote"
                  cite="https://www.themoviedb.org/api-terms-of-use"
                >
                  <Image
                    src={logo.src}
                    width={logo.width}
                    height={logo.height}
                    style={{ width: "100%" }}
                    alt="TMDB logo"
                  />
                  <Text>
                    This website uses TMDB and the TMDB APIs but is not
                    endorsed, certified, or otherwise approved by TMDB
                  </Text>
                </Text>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack spacing={12} direction="column" alignItems="flex-start">
              <Stack.Item>
                <Heading level={5}>Source of Movie Showings</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  Performances are retrieved for each of the venues below:
                </Text>
              </Stack.Item>
              <Stack.Item>
                <ol
                  style={{
                    listStyleType: "none",
                    padding: 0,
                  }}
                >
                  {Object.values(data!.venues)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ id, name, url }) => {
                      const movieCount = getMoviesShowingAt(
                        id,
                        data!.movies,
                      ).length;
                      return (
                        <li
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            listStyleType: "none",
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            📍 <ExternalLink href={url}>{name}</ExternalLink>
                          </span>
                          <span
                            style={{
                              flexShrink: 0,
                              marginLeft: "1rem",
                            }}
                          >
                            (📽️{" "}
                            <FilterLink
                              filters={{ filteredVenues: { [id]: true } }}
                            >
                              {showNumber(movieCount)} movie
                              {movieCount === 1 ? "" : "s"}
                            </FilterLink>
                            )
                          </span>
                        </li>
                      );
                    })}
                </ol>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Content>
    </Container>
  );
}
