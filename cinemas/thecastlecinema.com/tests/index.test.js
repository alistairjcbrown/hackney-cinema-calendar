/** @jest-environment setup-polly-jest/jest-environment-node */
const { setupPolly } = require("../../../common/test-utils");
const { retrieve, transform } = require("..");

describe("The Castle Cinema", () => {
  setupPolly("replay", __dirname);
  jest.useFakeTimers().setSystemTime(new Date("2025-01-23"));

  it("retrieve and transform", async () => {
    const { movieListPage, moviePages } = await retrieve();

    // Make sure the data looks roughly correct
    expect(movieListPage).toBeTruthy();
    expect(movieListPage).toBeTruthy();
    expect(Object.keys(moviePages).length).toBe(19);

    // Snapshot the transformation
    expect(
      await transform({ movieListPage, moviePages }, {}),
    ).toMatchSnapshot();
  }, 10_000);
});
