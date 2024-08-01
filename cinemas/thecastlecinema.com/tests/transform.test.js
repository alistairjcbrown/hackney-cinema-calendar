const fs = require("node:fs");
const path = require("node:path");
const transform = require("../transform");
const moviesWithLocalScreenings = fs.readFileSync(
  path.resolve(__dirname, "./mock-data/movie-with-local-screenings.txt"),
  "utf8",
);

describe("The Castle Cinema", () => {
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
