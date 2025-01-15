const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (result) => result;
const islington = {
  domain: "https://www.odeon.co.uk",
  url: "https://www.odeon.co.uk/cinemas/islington",
  cinemaId: "995",
};

jest.useFakeTimers().setSystemTime(new Date("2025-01-12"));

describe("Odeon Cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(islington, value, {})).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Islington", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(islington, value, {})).toMatchSnapshot();
    });
  });
});
