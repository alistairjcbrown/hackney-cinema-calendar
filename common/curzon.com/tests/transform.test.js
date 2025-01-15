const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (result) => result;
const aldgate = {
  domain: "https://www.curzon.com",
  url: "https://www.curzon.com/venues/aldgate",
};

jest.useFakeTimers().setSystemTime(new Date("2025-01-11"));

describe("Curzon cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(aldgate, value, {})).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Aldgate", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(aldgate, value, {})).toMatchSnapshot();
    });
  });
});
