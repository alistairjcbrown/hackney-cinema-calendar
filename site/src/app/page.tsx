"use client";
import type { Filters } from "@/types";
import { useDeferredValue } from "react";
import Checkbox from "rsuite/cjs/Checkbox";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Divider from "rsuite/cjs/Divider";
import Header from "rsuite/cjs/Header";
import RangeSlider from "rsuite/cjs/RangeSlider";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
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

  const {
    filteredVenues,
    filteredGenres,
    searchTerm,
    dateRange,
    yearRange,
    getYearRange,
    includeUnknownYears,
  } = filters;
  const setFilteredVenues = (filteredVenues: Filters["filteredVenues"]) =>
    setFilters({ ...filters, filteredVenues });
  const setFilteredGenres = (filteredGenres: Filters["filteredGenres"]) =>
    setFilters({ ...filters, filteredGenres });
  const setSearchTerm = (searchTerm: Filters["searchTerm"]) =>
    setFilters({ ...filters, searchTerm });
  const setDateRange = (dateRange: Filters["dateRange"]) =>
    setFilters({ ...filters, dateRange });
  const setYearRange = (yearRange: Filters["yearRange"]) =>
    setFilters({ ...filters, yearRange });
  const setIncludeUnknownYears = (
    includeUnknownYears: Filters["includeUnknownYears"],
  ) => setFilters({ ...filters, includeUnknownYears });

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
              {yearRange.min > yearRange.max ? null : (
                <>
                  <Divider vertical />
                  <Stack.Item grow={1}>
                    <Text weight="bold" style={{ color: "#fff" }}>
                      Years
                    </Text>
                    <RangeSlider
                      {...getYearRange()}
                      value={[yearRange.min, yearRange.max]}
                      onChange={([min, max]) => {
                        setYearRange({ min, max });
                      }}
                    />
                    <Checkbox
                      style={{ color: "#fff" }}
                      checked={includeUnknownYears}
                      onChange={(value, checked) => {
                        setIncludeUnknownYears(checked);
                      }}
                    >
                      Include unknown
                    </Checkbox>
                  </Stack.Item>
                </>
              )}
            </Stack>
          </Stack.Item>
        </Stack>
      </Header>
      <Content style={{ padding: "0 1.5rem" }}>
        <Summary movies={getMatchingMovies(data!.movies, filters)} />
        <MovieList filters={deferredFilters} />
      </Content>
    </Container>
  );
}
