"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDays, endOfDay, startOfDay } from "date-fns";
import distanceInKmBetweenCoordinates from "@/utils/distance-in-km-between-coordinates";
import { useCinemaData } from "@/state/cinema-data-context";
import { processingFunctions, useFilters } from "@/state/filters-context";
import type { CinemaData, DateRange, Position } from "@/types";

type VenueFilter = Record<string, boolean> | null;

function getVenuesNear(
  position: Position,
  data: CinemaData | null,
): VenueFilter {
  const distanceConsideredNearby = 3; // kilometers
  const venues = Object.values(data?.venues || {});

  const filteredVenues = venues.reduce((mapping, venue) => {
    const distance = distanceInKmBetweenCoordinates(position, venue.geo);
    if (distance > distanceConsideredNearby) return mapping;
    return { ...mapping, [venue.id]: true };
  }, {});

  return filteredVenues;
}

const dateRanges = [
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matcher: (value: string, data: CinemaData | null): boolean =>
      value === "today",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generator: (value: string, data: CinemaData | null): Promise<DateRange> =>
      new Promise((resolve) =>
        resolve({
          start: startOfDay(Date.now()).getTime(),
          end: endOfDay(Date.now()).getTime(),
        }),
      ),
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matcher: (value: string, data: CinemaData | null): boolean =>
      value === "tomorrow",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generator: (value: string, data: CinemaData | null): Promise<DateRange> =>
      new Promise((resolve) =>
        resolve({
          start: startOfDay(addDays(Date.now(), 1)).getTime(),
          end: endOfDay(addDays(Date.now(), 1)).getTime(),
        }),
      ),
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matcher: (value: string, data: CinemaData | null): boolean =>
      !!value.match(/\d{4}-\d{2}-\d{2}/),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generator: (value: string, data: CinemaData | null): Promise<DateRange> =>
      new Promise((resolve) =>
        resolve({
          start: startOfDay(new Date(value)).getTime(),
          end: endOfDay(new Date(value)).getTime(),
        }),
      ),
  },
];

const locations = [
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matcher: (value: string, data: CinemaData | null): boolean =>
      value === "near-me",
    generator: (value: string, data: CinemaData | null): Promise<VenueFilter> =>
      new Promise((resolve) => {
        if (!("geolocation" in navigator)) return resolve(null);

        navigator.geolocation.getCurrentPosition(({ coords }) => {
          const position = { lat: coords.latitude, lon: coords.longitude };
          const filteredVenues = getVenuesNear(position, data);
          resolve(filteredVenues);
        });
      }),
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matcher: (value: string, data: CinemaData | null): boolean => {
      const match = value.match(/^near-(.+)$/i);
      if (!match || !data?.venues) return false;

      return Object.values(data?.venues).some(
        ({ name, url }) => url.includes(match[1]) || name.includes(match[1]),
      );
    },
    generator: (value: string, data: CinemaData | null): Promise<VenueFilter> =>
      new Promise((resolve) => {
        const match = value.match(/^near-(.+)$/i);
        if (!match || !data?.venues) return resolve(null);

        const venue = Object.values(data?.venues).find(
          ({ name, url }) => url.includes(match[1]) || name.includes(match[1]),
        );
        if (!venue) return resolve(null);

        const filteredVenues = getVenuesNear(venue.geo, data);
        resolve(filteredVenues);
      }),
  },
];

export default function ShowingsRedirectContent() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();
  const { data } = useCinemaData();

  const query = window.location.hash.substring(1);
  // #/today/near-me
  const [timeSegment, locationSegment] = query
    .split("/")
    .filter((segment) => !!segment);

  useEffect(() => {
    let pendingDateRange: Promise<DateRange | null> = Promise.resolve(null);
    dateRanges.some(({ matcher, generator }) => {
      const isMatch = matcher(timeSegment, data);
      if (isMatch) pendingDateRange = generator(timeSegment, data);
      return isMatch;
    });

    let pendingFilteredVanues: Promise<VenueFilter> = Promise.resolve(null);
    locations.some(({ matcher, generator }) => {
      const isMatch = matcher(locationSegment, data);
      if (isMatch) pendingFilteredVanues = generator(locationSegment, data);
      return isMatch;
    });

    (async function () {
      const params = new URLSearchParams();
      const dateRange = await pendingDateRange;
      const filteredVenues = await pendingFilteredVanues;

      if (dateRange) {
        const dateRangeParam = processingFunctions.dateRange.toUrl(dateRange);
        params.set("dateRange", dateRangeParam);
      }

      if (filteredVenues) {
        const filterVenuesParam =
          processingFunctions.filteredVenues.toUrl(filteredVenues);
        params.set("filteredVenues", filterVenuesParam);
      }

      setFilters({
        ...filters,
        ...(dateRange ? { dateRange } : {}),
        ...(filteredVenues ? { filteredVenues } : {}),
      });
      router.push(`/?${params.toString()}`);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run this once on mount, regardless if data changes
  }, []);

  return null;
}