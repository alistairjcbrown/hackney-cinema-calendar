"use client";
import type { Filters } from "@/types";
import { useDeferredValue } from "react";
import { Container, Content, Divider, Header, Stack } from "rsuite";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import getMatchingMovies from "@/utils/get-matching-movies";
import Summary from "@/components/summary";
import Search from "@/components/search";
import DateRangePicker from "@/components/date-range";
import VenueFilter from "@/components/venue-filter";
import GenreFilter from "@/components/genre-filter";
import MovieList from "@/components/movie-list";

export default function Home() {
  const { data } = useCinemaData();
  const { filters, setFilters } = useFilters();

  const { filteredVenues, filteredGenres, searchTerm, dateRange } = filters;
  const setFilteredVenues = (filteredVenues: Filters["filteredVenues"]) =>
    setFilters({ ...filters, filteredVenues });
  const setFilteredGenres = (filteredGenres: Filters["filteredGenres"]) =>
    setFilters({ ...filters, filteredGenres });
  const setSearchTerm = (searchTerm: Filters["searchTerm"]) =>
    setFilters({ ...filters, searchTerm });
  const setDateRange = (dateRange: Filters["dateRange"]) =>
    setFilters({ ...filters, dateRange });

  const deferredFilters = useDeferredValue(filters);

  return (
    <Container>
      <Header
        style={{ padding: "20px", backgroundColor: "var(--rs-blue-700)" }}
      >
        <Stack direction="column" spacing={18}>
          <Stack.Item style={{ width: "100%" }}>
            <VenueFilter
              venues={data!.venues}
              values={filteredVenues}
              onChange={setFilteredVenues}
            />
          </Stack.Item>
          <Stack.Item style={{ width: "100%" }}>
            <GenreFilter
              genres={data!.genres}
              values={filteredGenres}
              onChange={setFilteredGenres}
            />
          </Stack.Item>
          <Stack.Item style={{ width: "100%" }}>
            <Stack>
              <Stack.Item grow={1}>
                <Search value={searchTerm} onChange={setSearchTerm} />
              </Stack.Item>
              <Divider vertical />
              <Stack.Item grow={1}>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Header>
      <Content>
        <Summary movies={getMatchingMovies(data!.movies, filters)} />
        <MovieList filters={deferredFilters} />
      </Content>
    </Container>
  );
}
