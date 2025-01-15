const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (result) => result;
const westIndiaQuay = {
  domain: "https://www.cineworld.co.uk",
  url: "https://www.cineworld.co.uk/cinemas/london-west-india-quay/041",
  cinemaId: "041",
};

jest.useFakeTimers().setSystemTime(new Date("2025-01-15"));

describe("Cineworld (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter({ filmShowings: [], filmData: {} });
      expect(await transform(westIndiaQuay, value, {})).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for West India Quay", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(westIndiaQuay, value, {})).toMatchSnapshot();
    });
  });
});
