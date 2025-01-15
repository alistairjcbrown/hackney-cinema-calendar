const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");
const transform = require("../transform");

jest.useFakeTimers().setSystemTime(new Date("2024-10-22"));

describe("Electric Cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = {
        filmData: { films: {}, screenings: {}, screeningTypes: {} },
      };
      expect(
        await transform(
          { cinemaId: "7497", domain: "https://www.electriccinema.co.uk" },
          value,
          {},
        ),
      ).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Portobello", () => {
    it("returns a list of events", async () => {
      const value = moviesWithLocalScreenings;
      expect(
        await transform(
          { cinemaId: "7497", domain: "https://www.electriccinema.co.uk" },
          value,
          {},
        ),
      ).toMatchSnapshot();
    });
  });

  describe("when movies with local screenings provided for White City", () => {
    it("returns a list of events", async () => {
      const value = moviesWithLocalScreenings;
      expect(
        await transform(
          { cinemaId: "55140", domain: "https://www.electriccinema.co.uk" },
          value,
          {},
        ),
      ).toMatchSnapshot();
    });
  });
});
