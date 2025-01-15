const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (result) => ({ result });
const westfieldStratford = {
  domain: "https://www.myvue.com",
  url: "https://www.myvue.com/cinema/westfield-stratford-city",
};

jest.useFakeTimers().setSystemTime(new Date("2025-01-09"));

describe("Vue Cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(westfieldStratford, value, {})).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Westfield Stratford", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(westfieldStratford, value, {})).toMatchSnapshot();
    });
  });
});
