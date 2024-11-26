import type { Movie, MoviePerformance } from "@/types";
import { Fragment } from "react";
import { Button, Divider, Heading } from "rsuite";
import { format } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";
import "./index.scss";

function PerformanceNotes({ notes }: { notes: string }) {
  const notePieces = notes.split("\n");
  if (notePieces.length > 1) {
    return notePieces.map((piece, index) => <div key={index}>{piece}</div>);
  }
  return notes;
}

export default function PerformanceList({ movie }: { movie?: Movie }) {
  const { data } = useCinemaData();

  if (!movie) {
    return (
      <div>
        No performances. Select more venues or try a different date range.
      </div>
    );
  }

  const dailyGrouping = movie.performances
    .sort((a, b) => a.time - b.time)
    .reduce(
      (grouping, performance) => {
        const day = format(new Date(performance.time), "yyyy-MM-dd");
        grouping[day] = grouping[day] || [];
        grouping[day].push(performance);
        return grouping;
      },
      {} as Record<string, MoviePerformance[]>,
    );

  return (
    <div className="performance-list">
      {Object.values(dailyGrouping).map((performanceGroup) => {
        const day = format(new Date(performanceGroup[0].time), "yyyy-MM-dd");
        return (
          <Fragment key={day}>
            <Heading level={4}>
              <Divider>{day}</Divider>
            </Heading>
            {performanceGroup.map((performance) => {
              const isInThePast = Date.now() > performance.time;
              const time = format(new Date(performance.time), "H:mm");
              const showing = movie.showings[performance.showingId];
              const venue = data?.venues[showing.venueId];
              const isExtraDetails = !!(
                performance.screen ||
                showing.title ||
                performance.notes
              );

              if (!isExtraDetails) {
                return (
                  <div
                    key={`${performance.showingId}-${performance.time}`}
                    className="performance-details"
                    style={
                      isInThePast ? { textDecoration: "line-through" } : {}
                    }
                  >
                    <a href={showing.url}>{venue?.name}</a>
                    <Button
                      href={performance.bookingUrl}
                      className="peformance-booking-button"
                      style={
                        isInThePast ? { textDecoration: "line-through" } : {}
                      }
                      disabled={isInThePast}
                    >
                      {time}
                    </Button>
                  </div>
                );
              }

              return (
                <details key={`${performance.showingId}-${performance.time}`}>
                  <summary
                    className="performance-details"
                    style={
                      isInThePast ? { textDecoration: "line-through" } : {}
                    }
                  >
                    <a href={showing.url}>{venue?.name}</a>
                    <Button
                      href={performance.bookingUrl}
                      className="peformance-booking-button"
                      style={
                        isInThePast ? { textDecoration: "line-through" } : {}
                      }
                      disabled={isInThePast}
                    >
                      {time}
                    </Button>
                  </summary>
                  <div className="performance-extra-details">
                    {performance.screen ? (
                      <div>
                        <strong>Screen:</strong> {performance.screen}
                      </div>
                    ) : null}
                    {showing.title ? (
                      <div>
                        <strong>Original listing title:</strong>{" "}
                        <em>{showing.title}</em>
                      </div>
                    ) : null}
                    {performance.notes ? (
                      <div>
                        <strong>Venue notes:</strong>{" "}
                        <PerformanceNotes notes={performance.notes} />
                      </div>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
