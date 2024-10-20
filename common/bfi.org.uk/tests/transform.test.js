const imaxMoviesWithLocalScreenings = require("./mock-data/imax-movie-with-local-screenings.json");
const southbankMoviesWithLocalScreenings = require("./mock-data/southbank-movie-with-local-screenings.json");
const transform = require("../transform");

jest.useFakeTimers().setSystemTime(new Date("2024-10-21"));

describe("BFI (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = "";
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Southbank", () => {
    it("returns a list of events", async () => {
      const value = southbankMoviesWithLocalScreenings;
      expect(
        await transform(
          { url: "https://whatson.bfi.org.uk/Online/default.asp" },
          value,
        ),
      ).toMatchSnapshot();
    });
  });

  describe("when movies with local screenings provided for IMAX", () => {
    it("returns a list of events", async () => {
      const value = imaxMoviesWithLocalScreenings;
      expect(
        await transform(
          { url: "https://whatson.bfi.org.uk/imax/Online/default.asp" },
          value,
        ),
      ).toMatchSnapshot();
    });
  });
});
