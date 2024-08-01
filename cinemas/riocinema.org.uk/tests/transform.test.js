const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (data) => ({ data: { movies: { data } } });

describe("Rio Cinema", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
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
