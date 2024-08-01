const transform = require("../transform");
const moviesWithNoLocalScreenings = require("./mock-data/movie-with-no-local-screenings.json");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (movies) => ({ movies });

describe("Hackney Picturehouse", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with no local screenings provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter(moviesWithNoLocalScreenings);
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(value)).toMatchSnapshot();
    });
  });
});
