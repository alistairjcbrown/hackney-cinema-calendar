const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (data) => ({ data: { movies: { data } } });
const rioCinema = { domain: "https://www.riocinema.org.uk" };

jest.useFakeTimers().setSystemTime(new Date("2024-08-01"));

describe("Cinema powered by Indy Cinema Group", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(rioCinema, value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Rio Cinema", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(rioCinema, value)).toMatchSnapshot();
    });
  });
});
