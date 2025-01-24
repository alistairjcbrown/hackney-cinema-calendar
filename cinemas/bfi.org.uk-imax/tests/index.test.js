const path = require("node:path");
const {
  schemaValidate,
  setupCacheMock,
} = require("../../../common/test-utils");
const { retrieve, transform, attributes } = require("..");

jest.mock("../../../common/cache");
setupCacheMock(__dirname, "2025-01-23");

// Hide script output
console.log = () => {};

describe(attributes.name, () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-23"));

  it("retrieve and transform", async () => {
    const moviePages = await retrieve();

    // Make sure the input looks roughly correct
    expect(moviePages).toBeTruthy();
    expect(Object.keys(moviePages).length).toBe(39);

    const output = await transform(moviePages, {});
    const data = JSON.parse(JSON.stringify(output));

    // Make sure the data looks roughly correct
    expect(data.length).toBe(39);

    expect(schemaValidate(data)).toBe(true);
    expect(data).toMatchSnapshot();
  });
});
