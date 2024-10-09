const cinema = process.argv[2];

const { writeFileSync } = require("fs");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ics = require("ics");
const dailyCache = require("./cache");
const {
  generateEventDescription,
  getEventDate,
  parseMinsToMs,
  sanitize,
} = require("./utils");
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

  process.stdout.write(` - Validating data ...   `);
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(shows)) {
    console.log(`\t❌ Error validating`);
    console.log(validate.errors);
    console.log(shows);
    throw new Error("Error validating");
  }
  console.log(`\t✅ Validated`);

  const dataFile = `./output/${cinema}-shows.json`;
  writeFileSync(dataFile, JSON.stringify(shows, null, 4));

  process.stdout.write(` - Generating calendar ...   `);
  let icsFormattedEvents;
  try {
    icsFormattedEvents = shows.reduce((events, show) => {
      // Default to 90 minutes if we don't know the duration
      const duration = show.overview.duration || parseMinsToMs(90);
      const showEvents = show.performances.map((performance) => ({
        title: sanitize(show.title),
        description: generateEventDescription(show, performance),
        categories: [].concat(show.overview.category),
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
}

generateCalendar();
