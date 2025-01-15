const transform = require("../transform");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (result) => result;
const bakerStreet = {
  domain: "https://www.everymancinema.com",
  url: "https://www.everymancinema.com/venues-list/x0712-everyman-baker-street/",
  cinemaId: "X0712",
};

jest.useFakeTimers().setSystemTime(new Date("2025-01-11"));

describe("Everyman Cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter({
        schedule: {},
        movieData: [],
        attributeData: [],
      });
      expect(await transform(bakerStreet, value, {})).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Baker Street", () => {
    it("returns a list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(bakerStreet, value, {})).toMatchSnapshot();
    });
  });
});
