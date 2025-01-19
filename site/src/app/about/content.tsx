"use client";
import {
  Certification,
  certificationOrder,
  type CinemaData,
  type Movie,
} from "@/types";
import { ReactNode } from "react";
import { formatDuration, intervalToDuration, parseISO } from "date-fns";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Heading from "rsuite/cjs/Heading";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import Divider from "rsuite/cjs/Divider";
import AppHeading from "@/components/app-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import getMovieCertification from "@/utils/get-movie-certification";
import MovieCertification from "@/components/movie-certification";
import logo from "./blue_long_1-8ba2ac31f354005783fab473602c34c3f4fd207150182061e425d366e4f34596.svg";

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
const getFestivalMovies = filterUnmatched([
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

const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <Link href={href} rel="noreferrer" target="_blank">
    {children}
  </Link>
);

export default function AboutContent() {
  const { data } = useCinemaData();
  const start = parseISO(data!.generatedAt);
  const dateDuration = intervalToDuration({ start, end: new Date() });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["years", "months", "weeks", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  const movieCount = getMovieCount(data!.movies);
  const certificationTotals = getCertificationCounts(data!.movies);
  return (
    <Container>
      <Head>
        <title>London Cinema Movies - About</title>
      </Head>
      <AppHeading />
      <Content style={{ padding: "1rem" }}>
        <Heading>General Stats</Heading>
        <Stack spacing={12} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Text>
              This site uses data retrieved{" "}
              <time dateTime={data!.generatedAt}>
                {formattedDuration ? `${formattedDuration} ago` : "just now"}
              </time>{" "}
              from {showNumber(getVenueCount(data!.venues))} venues, showing{" "}
              {showNumber(getPerformanceCount(data!.movies))} performances of{" "}
              {showNumber(movieCount)} movies.
            </Text>
            <Text>
              Of these, we were able to match{" "}
              {Math.round(
                (getMatchedMoviesCount(data!.movies) / movieCount) * 100,
              )}
              % ({showNumber(getMatchedMoviesCount(data!.movies))}) on{" "}
              <ExternalLink href="https://www.themoviedb.org">
                The Movie Database (TMDB)
              </ExternalLink>
              . The remaining unmatched events include{" "}
              <ExternalLink
                href={`/?filteredMovies=${getFestivalMovies(data!.movies).join(",")}`}
              >
                {showNumber(getFestivalMovies(data!.movies).length)} film
                festival showings
              </ExternalLink>
              ,{" "}
              <ExternalLink
                href={`/?filteredMovies=${getMarathons(data!.movies).join(",")}`}
              >
                {showNumber(getMarathons(data!.movies).length)} movie marathons
              </ExternalLink>
              , and{" "}
              <ExternalLink
                href={`/?filteredMovies=${getPremiere(data!.movies).join(",")}`}
              >
                {showNumber(getPremiere(data!.movies).length)} premiers
              </ExternalLink>
              .
            </Text>
          </Stack.Item>
          <Stack.Item>
            <Text>The spread of classifications for these films:</Text>
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
              The code for powering this site, including retriving performances
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
        </Stack>
        <Divider />
        <Heading>Sources</Heading>
        <Stack spacing={24} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading level={5}>Source of Movie data</Heading>
            <Stack spacing={12} direction="column" alignItems="flex-start">
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
                  This API is gratiously provided for free with attribution:
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text
                  as="blockquote"
                  cite="https://www.themoviedb.org/api-terms-of-use"
                >
                  <Image src={logo.src} height={logo.height} alt="TMDB logo" />
                  <Text>
                    This website uses TMDB and the TMDB APIs but is not
                    endorsed, certified, or otherwise approved by TMDB
                  </Text>
                </Text>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Heading level={5}>Source of Movie showings</Heading>
            <Text>
              Performances are retrieved for each of the venues below:
            </Text>
            <ol>
              {Object.values(data!.venues)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(({ id, name, url }) => {
                  const movieCount = getMoviesShowingAt(
                    id,
                    data!.movies,
                  ).length;
                  return (
                    <li key={id}>
                      <ExternalLink href={url}>{name}</ExternalLink> (
                      <ExternalLink href={`/?filteredVenues=${id}`}>
                        {showNumber(movieCount)} movie
                        {movieCount === 1 ? "" : "s"}
                      </ExternalLink>
                      )
                    </li>
                  );
                })}
            </ol>
          </Stack.Item>
        </Stack>
      </Content>
    </Container>
  );
}
