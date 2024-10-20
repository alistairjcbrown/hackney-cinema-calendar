const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (data) => ({ data: { movies: { data } } });

jest.useFakeTimers().setSystemTime(new Date("2024-08-01"));

describe("Rio Cinema", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(value)).toMatchSnapshot();
    });
  });
});
