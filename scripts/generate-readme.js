const getModuleNamesFor = require("../common/get-module-names-for");

const repo = "alistairjcbrown/hackney-cinema-calendar";

const locations = getModuleNamesFor("cinemas").map((site) => ({
  site,
  ...require(`../cinemas/${site}/attributes`),
}));

const locationUrls = locations.map(({ name, url, site, geo: { lat, lon } }) => {
  const mapUrl = `http://maps.google.com/maps?q=${encodeURIComponent(name)}+${encodeURIComponent("@")}${lat},${lon}`;
  const calendarUri = `github.com/${repo}/releases/latest/download/${site}-calendar.ics`;
  const calendarLink = `[${site}-calendar.ics](https://${calendarUri})`;
  // Note: calendar URL must use http and not https
  const googleCalendarLink = `[Google Calendar](https://calendar.google.com/calendar/render?cid=http://${calendarUri})`;

  return `${name} -
  [🌐 Site](${url})
  &nbsp;|&nbsp;
  [📍 Location](${mapUrl})

  - 📅&nbsp;
    ${calendarLink}
    (${googleCalendarLink})
`;
});

console.log(
  `Automatically generated calendar of events at:

- ${locationUrls.join("\n- ")}`,
);
