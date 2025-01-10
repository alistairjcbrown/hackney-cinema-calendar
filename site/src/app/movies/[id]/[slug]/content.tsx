"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "rsuite/cjs/Container";
import Heading from "rsuite/cjs/Heading";
import Footer from "rsuite/cjs/Footer";
import Content from "rsuite/cjs/Content";
import TagGroup from "rsuite/cjs/TagGroup";
import Tag from "rsuite/cjs/Tag";
import Panel from "rsuite/cjs/Panel";
import Sidebar from "rsuite/cjs/Sidebar";
import Stack from "rsuite/cjs/Stack";
import Divider from "rsuite/cjs/Divider";
import Toggle from "rsuite/cjs/Toggle";
import { intervalToDuration, formatDuration } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import getMatchingMovies from "@/utils/get-matching-movies";
import MoviePoster from "@/components/movie-poster";
import MovieCertification from "@/components/movie-certification";
import PerformanceList from "@/components/performance-list";
import SiteGeneratedMessage from "@/components/site-generated-message";
import "./page.css";

export default function MoviePageContent({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const [isShowingAllPerformances, setIsShowingAllPerformances] =
    useState(false);
  const { id } = use(params);
  const router = useRouter();
  const { data } = useCinemaData();
  const { filters, setFilters } = useFilters();
  const searchParams = useSearchParams();

  const matchingMovies = getMatchingMovies(data!.movies, filters);
  const movieAllPerformances = data?.movies[id];
  const movie = matchingMovies.find((movie) => movie.id === id);
  const displayedMovie = movie || movieAllPerformances;

  useEffect(() => {
    if (!movieAllPerformances || !displayedMovie) {
      router.push("/");
    }
  }, [router, movieAllPerformances, displayedMovie]);

  if (!movieAllPerformances || !displayedMovie) {
    return null;
  }

  const isFilterApplied =
    movie?.performances.length !== movieAllPerformances.performances.length;
  const duration =
    displayedMovie.duration ||
    displayedMovie.showings[Object.keys(displayedMovie.showings)[0]].overview
      .duration;
  const now = Date.now();
  const dateDuration = intervalToDuration({
    start: new Date(now),
    end: new Date(now + duration),
  });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["hours", "minutes"],
  });
  const filterParams =
    searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  return (
    <Container style={{ padding: "20px" }}>
      <Container>
        <Sidebar>
          <div style={{ paddingBottom: "14px" }}>
            <Link href={`/${filterParams}`}>&larr; Back</Link>
          </div>
          <Panel
            shaded
            bordered
            bodyFill
            style={{ display: "inline-block", width: 250 }}
          >
            <MoviePoster movie={displayedMovie} width={250} height={375} />
            <Panel header={displayedMovie.title}>
              <p>
                {displayedMovie.overview ? (
                  <small>{displayedMovie.overview}</small>
                ) : null}
              </p>
            </Panel>
          </Panel>
        </Sidebar>
        <Container style={{ padding: "20px" }}>
          <Content>
            <Heading level={1}>
              <MovieCertification movie={displayedMovie} />{" "}
              {displayedMovie.title}{" "}
              {displayedMovie.year ? `(${displayedMovie.year})` : null}
            </Heading>

            <Stack spacing={18} direction="column" alignItems="flex-start">
              <div>Duration: {formattedDuration}</div>
              <div>
                Venues
                <TagGroup>
                  {Array.from(
                    Object.values(displayedMovie.showings).reduce(
                      (unique, { venueId }) => unique.add(venueId),
                      new Set<string>(),
                    ),
                  )
                    .map((venueId) => data!.venues[venueId])
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ id, name }) => {
                      const { filteredVenues } = filters;
                      const filterVenueIds = Object.keys(filteredVenues);
                      const isInFilter = filterVenueIds.includes(id);
                      return (
                        <Tag
                          style={{ cursor: "pointer" }}
                          size="lg"
                          color={isInFilter ? "violet" : "blue"}
                          closable={isInFilter}
                          key={id}
                          onClick={() => {
                            if (isInFilter) {
                              delete filteredVenues[id];
                            } else {
                              filteredVenues[id] = true;
                            }
                            setFilters({ ...filters, filteredVenues });
                          }}
                        >
                          {name}
                        </Tag>
                      );
                    })}
                </TagGroup>
              </div>

              {displayedMovie.genres ? (
                <div>
                  Genres
                  <TagGroup>
                    {Object.values(displayedMovie.genres)
                      .map((id) => data!.genres[id])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(({ id, name }) => (
                        <Tag size="lg" color="blue" key={id}>
                          {name}
                        </Tag>
                      ))}
                  </TagGroup>
                </div>
              ) : null}
              {displayedMovie.directors ? (
                <div>
                  Directed by
                  <TagGroup>
                    {Object.values(displayedMovie.directors)
                      .map((id) => data!.people[id])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(({ id, name }) => (
                        <Tag size="lg" color="blue" key={id}>
                          {name}
                        </Tag>
                      ))}
                  </TagGroup>
                </div>
              ) : null}
              {displayedMovie.actors ? (
                <div>
                  Starring
                  <TagGroup>
                    {Object.values(displayedMovie.actors)
                      .map((id) => data!.people[id])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(({ id, name }) => (
                        <Tag size="lg" color="blue" key={id}>
                          {name}
                        </Tag>
                      ))}
                  </TagGroup>
                </div>
              ) : null}
              <div>
                Links:
                <ul>
                  {displayedMovie.isUnmatched ? (
                    <li>
                      <a
                        href={`https://www.themoviedb.org/search?query=${encodeURIComponent(displayedMovie.normalizedTitle)}`}
                      >
                        Search themoviedb
                      </a>
                    </li>
                  ) : null}
                  {displayedMovie.isUnmatched ? null : (
                    <li>
                      <a
                        href={`https://www.themoviedb.org/movie/${displayedMovie.id}`}
                      >
                        themoviedb
                      </a>
                    </li>
                  )}
                  {displayedMovie.imdbId ? (
                    <li>
                      <a
                        href={`https://www.imdb.com/title/${displayedMovie.imdbId}`}
                      >
                        IMDB
                      </a>
                    </li>
                  ) : null}
                  {displayedMovie.youtubeTrailer ? (
                    <li>
                      <a
                        href={`https://www.youtube.com/watch?v=${displayedMovie.youtubeTrailer}`}
                      >
                        Trailer (YouTube)
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            </Stack>
            <Divider />
            <Heading level={3}>
              Performances{" "}
              <Tag size="lg">
                {(isShowingAllPerformances ? movieAllPerformances : movie)
                  ?.performances.length || 0}
              </Tag>
              {isFilterApplied ? (
                <>
                  &nbsp;
                  <Toggle
                    checkedChildren={<>&nbsp;Filters Applied&nbsp;</>}
                    unCheckedChildren={<>&nbsp;Filters Removed&nbsp;</>}
                    checked={!isShowingAllPerformances}
                    onChange={(value) => setIsShowingAllPerformances(!value)}
                  />
                </>
              ) : null}
            </Heading>
            <PerformanceList
              movie={isShowingAllPerformances ? movieAllPerformances : movie}
            />
          </Content>
        </Container>
      </Container>
      <Footer>
        <Footer>
          <SiteGeneratedMessage generatedTime={data!.generatedAt} />
        </Footer>
      </Footer>
    </Container>
  );
}
