const path = require("node:path");
const { schemaValidate } = require("../../../common/test-utils");
const { dailyCache } = require("../../../common/cache");
const { readCache } = jest.requireActual("../../../common/cache");
const { retrieve, transform, attributes } = require("..");

// Mock out the caching function so we can return manual cache recordings for
// repsonses without needing to spin up a full browser
jest.mock("../../../common/cache");
dailyCache.mockImplementation((key) =>
  readCache(key, (filename) =>
    path.join(__dirname, "__manual-recordings__", `${filename}-2025-01-23`),
  ),
);

// Hide script output
console.log = () => {};

describe(
  attributes.name,
  () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-23"));

    it("retrieve and transform", async () => {
      const moviePages = await retrieve();

      // Make sure the input looks roughly correct
      expect(moviePages).toBeTruthy();
      expect(Object.keys(moviePages).length).toBe(203);

      const output = await transform(moviePages, {});
      const data = JSON.parse(JSON.stringify(output));

      // Make sure the data looks roughly correct
      expect(data.length).toBe(203);

      expect(schemaValidate(data)).toBe(true);
      expect(data).toMatchSnapshot();
    });
  },
  10_000,
);
