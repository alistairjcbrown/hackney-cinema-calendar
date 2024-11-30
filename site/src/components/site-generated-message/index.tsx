import { formatDuration, intervalToDuration } from "date-fns";

export default function SiteGeneratedMessage({
  generatedTime,
}: {
  generatedTime: string | undefined;
}) {
  if (!generatedTime) return null;

  const time = parseInt(generatedTime, 10) * 1000;
  const dateDuration = intervalToDuration({
    start: new Date(time),
    end: new Date(),
  });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["hours", "minutes"],
  });

  return (
    <div style={{ textAlign: "center", margin: "2rem" }}>
      Site generated on {new Date(time).toLocaleDateString()} at{" "}
      {new Date(time).toLocaleTimeString()} (
      {formattedDuration ? `${formattedDuration} ago` : "Just now!"})
    </div>
  );
}
