import { formatDuration, intervalToDuration } from "date-fns";

export default function SiteGeneratedMessage({
  generatedTime,
}: {
  generatedTime: string | undefined;
}) {
  if (!generatedTime) return null;

  const time = new Date(generatedTime);
  const dateDuration = intervalToDuration({
    start: new Date(time),
    end: new Date(),
  });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["years", "months", "weeks", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  return (
    <div style={{ textAlign: "center", margin: "2rem" }}>
      Data retrieved on {new Date(time).toLocaleDateString()} at{" "}
      {new Date(time).toLocaleTimeString()} (
      {formattedDuration ? `${formattedDuration} ago` : "Just now!"})
    </div>
  );
}
