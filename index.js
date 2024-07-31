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
} = require("./utils");
const schema = require("./schema.json");
const {
  retrieve,
  transform,
  attributes: { url, location, geo },
} = require(`./cinemas/${cinema}`);

async function generateCalendar() {
  console.log(`[Cinema: ${cinema}]`);

  process.stdout.write(` - Retriving data ...   `);
  const data = await dailyCache(cinema, () => retrieve());
  console.log(`\t✅ Retrieved`);

  process.stdout.write(` - Transforming data ...   `);
  const shows = await transform(data);
  console.log(`\t✅ Transformed`);

  process.stdout.write(` - Validating data ...   `);
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(shows)) {
    console.log(validate.errors);
    throw new Error("Error validating JSON");
  }
  console.log(`\t✅ Validated`);

  const dataFile = `./output/${cinema}-shows.json`;
  writeFileSync(dataFile, JSON.stringify(shows, null, 4));

  process.stdout.write(` - Generating calendar ...   `);
  // Create an event for each show performance
  const icsFormattedEvents = shows.reduce((events, show) => {
    // Default to 90 minutes if we don't know the duration
    const duration = show.overview.duration || parseMinsToMs(90);
    const showEvents = show.performances.map((performance) => ({
      title: show.title,
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

  // Write out ICS file of events
  const { error, value } = ics.createEvents(icsFormattedEvents);
  if (error) {
    console.log(error);
    throw new Error("Error generating ICS file");
  }
  console.log(`\t✅ Calendar generated`);

  const calendarFile = `./output/${cinema}-calendar.ics`;
  writeFileSync(calendarFile, value);

  console.log(`🗂️ Files created`);
}

generateCalendar();
