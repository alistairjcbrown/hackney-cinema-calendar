const { writeFileSync } = require("fs");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ics = require("ics");
const getModuleNamesFor = require("./common/get-module-names-for");
const {
  dailyCache,
  getCacheStats,
  clearCacheStats,
} = require("./common/cache");
const hydrate = require("./common/hydrate");
const {
  generateEventDescription,
  getEventDate,
  parseMinsToMs,
  sanitize,
} = require("./common/utils");
const schema = require("./schema.json");

const getDuration = (show) => {
  const title = show.title.toLowerCase();
  const isAllNighter =
    !!title.match(/all[\s|-]night/i) || !!title.match(/\s+marathon$/i);
  // Default to 90 minutes if we don't know the duration
  // unless it's an all nighter/marathon, then make it 6 hours
  const defaultDuration = isAllNighter ? parseMinsToMs(360) : parseMinsToMs(90);
  return show.overview.duration || defaultDuration;
};

async function generateCalendar(cinema) {
  const { retrieve, transform, attributes } = require(`./cinemas/${cinema}`);
  const { url, name, address, geo } = attributes;
  clearCacheStats();

  console.log(`[🎞️  Cinema: ${cinema}]`);

  process.stdout.write(` - Retriving data ...   `);
  let data;
  try {
    const start = Date.now();
    data = await dailyCache(cinema, () => retrieve());
    console.log(`\t✅ Retrieved (${Math.round((Date.now() - start) / 1000)}s)`);
  } catch (e) {
    console.log(`\t❌ Error retriving`);
    throw e;
  }

  const sources = getModuleNamesFor("sources");
  const sourcedEvents = {};
  for (source of sources) {
    const { findEvents } = require(`./sources/${source}`);
    sourcedEvents[source] = await findEvents(attributes);
  }

  process.stdout.write(` - Transforming data ...   `);
  let shows;
  try {
    const start = Date.now();
    shows = await transform(data, sourcedEvents);
    console.log(
      `\t✅ Transformed (${Math.round((Date.now() - start) / 1000)}s)`,
    );
  } catch (e) {
    console.log(`\t❌ Error transforming`);
    throw e;
  }

  process.stdout.write(` - Hydrating movie data ...   `);
  let hydratedShows;
  try {
    const start = Date.now();
    hydratedShows = await hydrate(shows);
    const hydrated = hydratedShows.filter(({ moviedb }) => !!moviedb).length;
    console.log(
      `\t✅ Hydrated (${hydrated}/${hydratedShows.length} in ${Math.round((Date.now() - start) / 1000)}s)`,
    );
  } catch (e) {
    console.log(`\t❌ Error hydrating`);
    throw e;
  }

  process.stdout.write(` - Validating data ...   `);
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(hydratedShows)) {
    console.log(`\t❌ Error validating`);
    console.log(validate.errors);
    throw new Error("Error validating");
  }
  console.log(`\t✅ Validated`);

  const dataFile = `./output/${cinema}-shows.json`;
  writeFileSync(dataFile, JSON.stringify(hydratedShows, null, 4));

  process.stdout.write(` - Generating calendar ...   `);
  let icsFormattedEvents;
  try {
    icsFormattedEvents = hydratedShows.reduce((events, show) => {
      const duration = getDuration(show);
      const showEvents = show.performances.map((performance) => ({
        title: sanitize(show.title),
        description: generateEventDescription(show, performance),
        categories: [].concat(show.overview.categories),
        start: getEventDate(performance.time),
        end: getEventDate(performance.time + duration),
        url,
        location: `${name}, ${address}`,
        geo,
      }));
      return events.concat(showEvents);
    }, []);
  } catch (e) {
    console.log(`\t❌ Error generating events`);
    throw new Error("Error generating events");
  }

  const { error, value } = ics.createEvents(icsFormattedEvents);
  if (error) {
    console.log(`\t❌ Error generating ISC file`);
    console.log(error);
    throw new Error("Error generating ICS file");
  }
  console.log(`\t✅ Generated`);

  const calendarFile = `./output/${cinema}-calendar.ics`;
  writeFileSync(calendarFile, value);

  console.log(`🗂️  Files created`);
  console.log(" ");

  const {
    hits: { length: hit },
    misses: { length: miss },
  } = getCacheStats();
  const percentage = Math.round((hit / (hit + miss)) * 100);
  console.log(`📊 ${percentage}% cache success (${hit} hits, ${miss} misses)`);

  const unhydrated = hydratedShows.filter((show) => !show.moviedb);
  const unhydratedCount = unhydrated.length;
  if (unhydratedCount > 0) {
    const showsText = `show${unhydratedCount === 1 ? "" : "s"}`;
    console.log(`🏜️ Unable to hydrate ${unhydratedCount} ${showsText}`);
    console.log(` * ${unhydrated.map(({ title }) => title).join("\n * ")}`);
  } else {
    console.log(`🌊 All shows hydrated`);
  }
}

(async function () {
  const parameter = process.argv[2];
  const cinemas = getModuleNamesFor("cinemas");

  if (parameter === "all") {
    for (cinema of cinemas) {
      await generateCalendar(cinema);
      console.log("\n---\n");
    }
  } else if (parameter === "fast") {
    for (cinema of cinemas.filter(
      (cinema) => !cinema.startsWith("bfi.org.uk"),
    )) {
      await generateCalendar(cinema);
      console.log("\n---\n");
    }
  } else if (cinemas.includes(parameter)) {
    await generateCalendar(parameter);
  } else {
    throw new Error("❌ Invalid cinema provided");
  }
})();
