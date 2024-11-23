import type { Filters, Movie } from "@/types";
import { intervalToDuration, formatDuration } from "date-fns";
import classNames from "classnames";
import { useFilters } from "@/state/filters-context";
import MoviePoster from "../movie-poster";
import "./index.scss";

const getVenueCount = (movie: Movie, filters: Filters) =>
  movie.performances.reduce((venueIds, { showingId }) => {
    const venueId = movie.showings[showingId].venueId;
    if (filters.filteredVenues[venueId]) venueIds.add(venueId);
    return venueIds;
  }, new Set()).size;

const getTimeToNextPerformance = (performances: Movie["performances"]) => {
  const sortedPerformances = performances.sort((a, b) => a.time - b.time);
  const nextPerformance = sortedPerformances.find(
    ({ time }) => time - Date.now() > 0,
  );
  if (!nextPerformance) return "All showings have finished";

  const durationUntil = intervalToDuration({
    start: new Date(),
    end: new Date(nextPerformance.time),
  });

  const largeTimeToNextShowing = formatDuration(durationUntil, {
    format: ["months", "weeks", "days"],
  });
  if (largeTimeToNextShowing)
    return `Next showing in ${largeTimeToNextShowing}`;

  const shortTimeToNextShowing = formatDuration(durationUntil, {
    format: ["hours", "minutes"],
  });
  if (shortTimeToNextShowing)
    return `Next showing in ${shortTimeToNextShowing}`;

  return "Next showing now!";
};

export default function MovieItem({
  movie,
  className,
}: {
  movie: Movie;
  className?: string;
}) {
  const { filters } = useFilters();

  const performanceCount = movie.performances.length;
  const performanceSummary =
    performanceCount === 1
      ? `${performanceCount} performance`
      : `${performanceCount} performances`;

  const venueCount = getVenueCount(movie, filters);
  const venueSummary =
    venueCount === 1 ? `${venueCount} venue` : `${venueCount} venues`;

  return (
    <div className={classNames("movie-item", className)}>
      <MoviePoster movie={movie} />
      <div className="movie-item-text-wrapper">
        <div className="movie-item-title" tabIndex={-1}>
          {movie.title}
        </div>
        <div className="movie-item-summary">
          {performanceSummary} at {venueSummary}
          <br />
          {getTimeToNextPerformance(movie.performances)}
        </div>
      </div>
    </div>
  );
}
