const fs = require("node:fs");
const path = require("node:path");
const transform = require("../transform");

const readMockData = (filename) =>
  fs.readFileSync(
    path.resolve(__dirname, `./mock-data/${filename}.txt`),
    "utf8",
  );

const moviesWithLocalScreenings = readMockData("movie-with-local-screenings");

jest.useFakeTimers().setSystemTime(new Date("2024-10-12"));

describe("The Prince Charles Cinema", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = "";
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided", () => {
    it("returns an empty list of events", async () => {
      const value = moviesWithLocalScreenings;
      expect(await transform(value)).toMatchSnapshot();
    });
  });
});