/** @jest-environment setup-polly-jest/jest-environment-node */
const { setupPolly } = require("../../../common/test-utils");
const { retrieve, transform } = require("..");

describe("The Castle Cinema", () => {
  setupPolly("replay", __dirname);
  jest.useFakeTimers().setSystemTime(new Date("2025-01-23"));

  it("retrieve and transform", async () => {
    const { movieListPage, moviePages } = await retrieve();

    // Make sure the input looks roughly correct
    expect(movieListPage).toBeTruthy();
    expect(movieListPage).toBeTruthy();
    expect(Object.keys(moviePages).length).toBe(21);

    const output = await transform({ movieListPage, moviePages }, {});
    const data = JSON.parse(JSON.stringify(output));

    // Make sure the data looks roughly correct
    expect(data.length).toBe(21);

    expect(data).toMatchSnapshot();
  }, 10_000);
});
