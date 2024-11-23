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

  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    dateRange,
    filteredVenues,
    filteredGenres,
  });

  return (
    <FiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}
