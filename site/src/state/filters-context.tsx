import type { CinemaData, Filters } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { startOfDay, endOfDay, addMonths } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";

const convertToFilterList = (
  data: CinemaData["genres"] | CinemaData["venues"],
) =>
  Object.values(data).reduce(
    (mapped, { id }) => ({ ...mapped, [id]: true }),
    {} as Record<string, boolean>,
  );

const FiltersContext = createContext<{
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
}>({
  filters: {
    searchTerm: "",
    dateRange: { start: 0, end: 0 },
    yearRange: { min: Infinity, max: -Infinity },
    getYearRange: () => ({ min: Infinity, max: -Infinity }),
    includeUnknownYears: true,
    filteredVenues: {},
    filteredGenres: {},
  },
  setFilters: () => {},
});

export const useFilters = () => useContext(FiltersContext);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data } = useCinemaData();

  const filteredVenues = useMemo(
    () => (data?.venues ? convertToFilterList(data.venues) : {}),
    [data?.venues],
  );
  const filteredGenres = useMemo(
    () => (data?.genres ? convertToFilterList(data.genres) : {}),
    [data?.genres],
  );

  const dateRange = useMemo(
    () => ({
      start: startOfDay(Date.now()).getTime(),
      end: endOfDay(addMonths(Date.now(), 2)).getTime(),
    }),
    [],
  );

  const getYearRange = () =>
    data?.movies
      ? Object.values(data.movies).reduce(
          (maxMin, movie) => {
            if (!movie.year) return maxMin;
            const year = parseInt(movie.year, 10);
            return {
              max: Math.max(maxMin.max, year),
              min: Math.min(maxMin.min, year),
            };
          },
          { max: -Infinity, min: Infinity },
        )
      : { max: -Infinity, min: Infinity };
  const yearRange = useMemo(getYearRange, [data?.movies]);

  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    dateRange,
    yearRange,
    getYearRange,
    includeUnknownYears: true,
    filteredVenues,
    filteredGenres,
  });

  return (
    <FiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}
