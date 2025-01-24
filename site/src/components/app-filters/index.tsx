import { Classification, type Filters } from "@/types";
import Accordion from "rsuite/cjs/Accordion";
import Checkbox from "rsuite/cjs/Checkbox";
import Divider from "rsuite/cjs/Divider";
import RangeSlider from "rsuite/cjs/RangeSlider";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import useMediaQuery from "rsuite/cjs/useMediaQuery";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import Search from "@/components/search";
import DateRangePicker from "@/components/date-range";
import VenueFilter from "@/components/venue-filter";
import MovieFilter from "@/components/movie-filter";
import ClassificationFilter from "@/components/classification-filter";
import GenreFilter from "@/components/genre-filter";

export default function AppFilters() {
  const [isDesktop] = useMediaQuery(["lg"]);
  const { data } = useCinemaData();
  const { filters, defaultFilters, setFilters, getYearRange } = useFilters();

  const {
    filteredVenues,
    filteredMovies,
    filteredClassifications,
    filteredGenres,
    searchTerm,
    dateRange,
    yearRange,
    includeUnknownYears,
  } = filters;
  const setFilteredVenues = (filteredVenues: Filters["filteredVenues"]) =>
    setFilters({ ...filters, filteredVenues });
  const setFilteredMovies = (filteredMovies: Filters["filteredMovies"]) =>
    setFilters({ ...filters, filteredMovies });
  const setFilteredClassifications = (
    filteredClassifications: Filters["filteredClassifications"],
  ) => setFilters({ ...filters, filteredClassifications });
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

  return (
    <>
      <Search value={searchTerm} onChange={setSearchTerm} />
      <Accordion>
        <Accordion.Panel header="More filters" style={{ padding: 0 }}>
          <Stack direction="column" spacing={18}>
            <Stack.Item style={{ width: "100%" }}>
              <VenueFilter
                venues={data!.venues}
                values={filteredVenues}
                onChange={setFilteredVenues}
              />
            </Stack.Item>
            <Stack.Item style={{ width: "100%" }}>
              <MovieFilter
                movies={data!.movies}
                values={filteredMovies}
                onChange={setFilteredMovies}
              />
            </Stack.Item>
            <Stack.Item style={{ width: "100%" }}>
              <ClassificationFilter
                classifications={
                  Object.keys(
                    defaultFilters!.filteredClassifications,
                  ) as Classification[]
                }
                values={filteredClassifications}
                onChange={setFilteredClassifications}
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
              <Stack
                direction={isDesktop ? "row" : "column"}
                spacing={isDesktop ? 0 : 8}
                alignItems="flex-start"
              >
                <Stack.Item grow={1} style={isDesktop ? {} : { width: "100%" }}>
                  <DateRangePicker
                    value={dateRange}
                    defaultValue={defaultFilters?.dateRange}
                    onChange={setDateRange}
                  />
                </Stack.Item>
                {yearRange.min > yearRange.max ? null : (
                  <>
                    {isDesktop ? <Divider vertical /> : null}
                    <Stack.Item
                      grow={1}
                      style={isDesktop ? {} : { width: "100%" }}
                    >
                      <Stack
                        direction={isDesktop ? "column" : "row"}
                        spacing={8}
                      >
                        <Stack.Item style={isDesktop ? { width: "100%" } : {}}>
                          <Text weight="bold">Years:</Text>
                        </Stack.Item>
                        <Stack.Item
                          style={{
                            width: "100%",
                            paddingLeft: "1rem",
                            paddingRight: "1rem",
                          }}
                        >
                          <RangeSlider
                            {...getYearRange()}
                            value={[yearRange.min, yearRange.max]}
                            onChange={([min, max]) => {
                              setYearRange({ min, max });
                            }}
                          />
                        </Stack.Item>
                        <Stack.Item style={isDesktop ? { width: "100%" } : {}}>
                          <Checkbox
                            checked={includeUnknownYears}
                            onChange={(value, checked) => {
                              setIncludeUnknownYears(checked);
                            }}
                          >
                            Include&nbsp;unknown
                          </Checkbox>
                        </Stack.Item>
                      </Stack>
                    </Stack.Item>
                  </>
                )}
              </Stack>
            </Stack.Item>
          </Stack>
        </Accordion.Panel>
      </Accordion>
    </>
  );
}
