const cinema = process.argv[2];

const { writeFileSync } = require("fs");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ics = require("ics");
const { dailyCache, getCacheStats } = require("./common/cache");
const hydrate = require("./common/hydrate");
const {
  generateEventDescription,
  getEventDate,
  parseMinsToMs,
  sanitize,
} = require("./common/utils");
const schema = require("./schema.json");
const {
  retrieve,
  transform,
  attributes: { url, location, geo },
} = require(`./cinemas/${cinema}`);

async function generateCalendar() {
  console.log(`[🎞️  Cinema: ${cinema}]`);

  process.stdout.write(` - Retriving data ...   `);
  let data;
  try {
    data = await dailyCache(cinema, () => retrieve());
    console.log(`\t✅ Retrieved`);
  } catch (e) {
    console.log(`\t❌ Error retriving`);
    throw e;
  }

  process.stdout.write(` - Transforming data ...   `);
  let shows;
  try {
    shows = await transform(data);
    console.log(`\t✅ Transformed`);
  } catch (e) {
    console.log(`\t❌ Error transforming`);
    throw e;
  }

  process.stdout.write(` - Hydrating movie data ...   `);
  let hydratedShows;
  try {
    hydratedShows = await hydrate(shows);
    const hydrated = hydratedShows.filter(({ moviedb }) => !!moviedb).length;
    console.log(`\t✅ Hydrated (${hydrated} of ${hydratedShows.length})`);
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
      // Default to 90 minutes if we don't know the duration
      const duration = show.overview.duration || parseMinsToMs(90);
      const showEvents = show.performances.map((performance) => ({
        title: sanitize(show.title),
        description: generateEventDescription(show, performance),
        categories: [].concat(show.overview.categories),
        start: getEventDate(performance.time),
        end: getEventDate(performance.time + duration),
        url,
        location,
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
  console.log("");

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

generateCalendar();
