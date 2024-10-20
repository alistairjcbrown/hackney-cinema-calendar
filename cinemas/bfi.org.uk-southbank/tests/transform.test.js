const fs = require("node:fs");
const path = require("node:path");
const transform = require("../transform");

const readMockData = (filename) =>
  fs.readFileSync(
    path.resolve(__dirname, `./mock-data/${filename}.txt`),
    "utf8",
  );

const moviesWithLocalScreenings = readMockData("movie-with-local-screenings");

jest.useFakeTimers().setSystemTime(new Date("2024-10-20"));

// Disable caching for test
jest.mock("../../../common/cache", () => ({
  dailyCache: (key, retrieve) => retrieve(),
}));

// Mock retrieve calls for additional data
jest.mock("../retrieve", () => (url) => {
  const [, slug] = url.split("article/");
  if (slug) {
    return readMockData(`show-${slug}`);
  }

  const [, id] = url.split("article_id=");
  const [, page] = url.match(/current_page=(\d)+&/);
  switch (id) {
    case "CE6463D3-DB5E-4E11-8A61-3D7F70969FA3": {
      return readMockData(`show-watership-down-${page}`);
    }
  }
});

describe("BFI Southbank", () => {
  describe("when no movies provided", () => {
    it("returns an empty list of events", async () => {
      const value = "";
      expect(await transform(value)).toEqual([]);
    });
  });

  describe("when movies with local screenings provided", () => {
    it("returns a list of events", async () => {
      const value = moviesWithLocalScreenings;
      expect(await transform(value)).toMatchSnapshot();
    });
  });
});
