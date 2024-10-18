const transform = require("../transform");
const moviesWithNoLocalScreenings = require("./mock-data/movie-with-no-local-screenings.json");
const moviesWithLocalScreenings = require("./mock-data/movie-with-local-screenings.json");

const formatParameter = (movies) => ({ movies });
const cinema = { domain: "https://www.picturehouses.com", cinemaId: undefined };
const hackney = { ...cinema, cinemaId: "010" };
const finsburyPark = { ...cinema, cinemaId: "031" };

jest.useFakeTimers().setSystemTime(new Date("2024-08-01"));

describe("Picturehouse Cinema (common)", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter([]);
      expect(await transform(hackney, value)).toEqual([]);
    });
  });

  describe("when movies with no local screenings provided", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter(moviesWithNoLocalScreenings);
      expect(await transform(hackney, value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided for Hackney", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(hackney, value)).toMatchSnapshot();
    });
  });

  describe("when movies with local screenings provided for Finsbury Park", () => {
    it("returns an empty list of events", async () => {
      const value = formatParameter(moviesWithLocalScreenings);
      expect(await transform(finsburyPark, value)).toMatchSnapshot();
    });
  });
});
