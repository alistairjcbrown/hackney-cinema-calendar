const package = require("../package.json");
const repo = "alistairjcbrown/hackney-cinema-calendar";

const sites = Object.keys(package.scripts).reduce((matched, name) => {
  const isGenerate = name.match(/^generate:(.*)$/i);
  if (isGenerate) return matched.concat(isGenerate[1].toLowerCase());
  return matched;
}, []);

const locations = sites.map((site) => ({
  site,
  ...require(`../cinemas/${site}/attributes`),
}));

const locationUrls = locations.map(
  ({ name, geo: { lat, lon } }) =>
    `📍\n  [${name}](http://maps.google.com/maps?q=${encodeURIComponent(name)}+${encodeURIComponent("@")}${lat},${lon})`,
);

const dataSources = locations.map(({ url }) => `🌐 ${url}`);

const calendarFiles = locations.map(({ site }) => {
  const calendarUri = `github.com/${repo}/releases/latest/download/${site}-calendar.ics`;
  const link = `[${site}-calendar.ics](https://${calendarUri})`;
  // Note: calendar URL must use http and not https
  const googleCalendar = `[Google Calendar](https://calendar.google.com/calendar/render?cid=http://${calendarUri})`;
  const webcal = `[Webcal](webcal://${calendarUri})`;
  return `📅\n  ${link}\n  (${googleCalendar},\n  ${webcal})`;
});

console.log(
  `
Automatically generated calendar of events at:

- ${locationUrls.join("\n- ")}

Cinema listings from:

- ${dataSources.join("\n- ")}

The latest calendar files are available at:

- ${calendarFiles.join("\n- ")}
`.trim(),
);
