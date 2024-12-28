import type { CinemaData, Filters } from "@/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startOfDay, endOfDay, addMonths } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";

function safelyJsonStringify<T>(value: T): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function safelyJsonParse<T>(value: string): T | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- typescript, let's not fight
export const processingFunctions: Record<keyof Filters, any> = {
  searchTerm: {
    toUrl: (value: Filters["searchTerm"]) => encodeURIComponent(value),
    fromUrl: (value: string) => decodeURIComponent(value),
  },
  dateRange: {
    toUrl: (value: Filters["dateRange"]) =>
      safelyJsonStringify<Filters["dateRange"]>(value),
    fromUrl: (value: string) => safelyJsonParse<Filters["dateRange"]>(value),
  },
  yearRange: {
    toUrl: (value: Filters["yearRange"]) =>
      safelyJsonStringify<Filters["yearRange"]>(value),
    fromUrl: (value: string) => safelyJsonParse<Filters["yearRange"]>(value),
  },
  includeUnknownYears: {
    toUrl: (value: Filters["includeUnknownYears"]) =>
      value ? "true" : "false",
    fromUrl: (value: string) => value === "true",
  },
  filteredVenues: {
    toUrl: (value: Filters["filteredVenues"]) => Object.keys(value).join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredGenres: {
    toUrl: (value: Filters["filteredGenres"]) => Object.keys(value).join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
};

const convertToFilterList = (
  data: CinemaData["genres"] | CinemaData["venues"],
) =>
  Object.values(data).reduce(
    (mapped, { id }) => ({ ...mapped, [id]: true }),
    {} as Record<string, boolean>,
  );

const FiltersContext = createContext<{
  filters: Filters;
  getYearRange: () => Filters["yearRange"];
  setFilters: Dispatch<SetStateAction<Filters>>;
}>({
  filters: {
    searchTerm: "",
    dateRange: { start: 0, end: 0 },
    yearRange: { min: Infinity, max: -Infinity },
    includeUnknownYears: true,
    filteredVenues: {},
    filteredGenres: {},
  },
  getYearRange: () => ({ min: Infinity, max: -Infinity }),
  setFilters: () => {},
});

export const useFilters = () => useContext(FiltersContext);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data } = useCinemaData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getYearRange = useCallback(
    () =>
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
        : { max: -Infinity, min: Infinity },
    [data?.movies],
  );

  const defaultFilters = useMemo(() => {
    const filteredVenues = data?.venues ? convertToFilterList(data.venues) : {};
    const filteredGenres = data?.genres ? convertToFilterList(data.genres) : {};
    const yearRange = getYearRange();
    const dateRange = {
      start: startOfDay(Date.now()).getTime(),
      end: endOfDay(addMonths(Date.now(), 2)).getTime(),
    };

    return {
      searchTerm: "",
      dateRange,
      yearRange,
      includeUnknownYears: true,
      filteredVenues,
      filteredGenres,
    };
  }, [data?.genres, data?.venues, getYearRange]);

  const getUrlFilters = () => {
    const urlFilters = {} as Filters;

    const searchTerm = searchParams.get("searchTerm");
    if (searchTerm) {
      urlFilters.searchTerm =
        processingFunctions.searchTerm.fromUrl(searchTerm);
    }

    const dateRange = searchParams.get("dateRange");
    if (dateRange) {
      const dateRangeFromUrl = processingFunctions.dateRange.fromUrl(dateRange);
      if (dateRangeFromUrl) urlFilters.dateRange = dateRangeFromUrl;
    }

    const yearRange = searchParams.get("yearRange");
    if (yearRange) {
      const yearRangeFromUrl = processingFunctions.yearRange.fromUrl(yearRange);
      if (yearRangeFromUrl) urlFilters.yearRange = yearRangeFromUrl;
    }

    const includeUnknownYears = searchParams.get("includeUnknownYears");
    if (includeUnknownYears) {
      urlFilters.includeUnknownYears =
        processingFunctions.includeUnknownYears.fromUrl(includeUnknownYears);
    }

    const filteredVenues = searchParams.get("filteredVenues");
    if (filteredVenues) {
      urlFilters.filteredVenues =
        processingFunctions.filteredVenues.fromUrl(filteredVenues);
    }

    const filteredGenres = searchParams.get("filteredGenres");
    if (filteredGenres) {
      urlFilters.filteredGenres =
        processingFunctions.filteredGenres.fromUrl(filteredGenres);
    }

    return urlFilters;
  };

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    ...getUrlFilters(),
  });

  const setFiltersAndUpdateUrl = (value: SetStateAction<Filters>): void => {
    const existingFilters = filters;
    const updatedFilters = value as Filters;

    const params = new URLSearchParams(searchParams.toString());
    Object.keys(defaultFilters).forEach((key) => {
      const property = key as keyof Filters;
      if (existingFilters[property] !== updatedFilters[property]) {
        const value = processingFunctions[property].toUrl(
          updatedFilters[property],
        );
        if (value) {
          params.set(property, value);
        } else {
          params.delete(property);
        }
      }
    });
    router.replace(`${pathname}?${params.toString()}`);

    return setFilters(value);
  };

  return (
    <FiltersContext.Provider
      value={{ filters, getYearRange, setFilters: setFiltersAndUpdateUrl }}
    >
      {children}
    </FiltersContext.Provider>
  );
}
