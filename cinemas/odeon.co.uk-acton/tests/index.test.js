const {
  setupCacheMock,
  schemaValidate,
} = require("../../../common/test-utils");
const { retrieve, transform, attributes } = require("..");

jest.mock("../../../common/cache");
setupCacheMock(__dirname, "2025-01-24");

describe(attributes.name, () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-24"));

  it("retrieve and transform", async () => {
    const moviePages = await retrieve();

    // Make sure the input looks roughly correct
    expect(moviePages).toBeTruthy();
    expect(moviePages.length).toBe(31);

    const output = await transform(moviePages, {});
    const data = JSON.parse(JSON.stringify(output));

    // Make sure the data looks roughly correct
    expect(data.length).toBe(38); // This count is not related to the above

    expect(schemaValidate(data)).toBe(true);
    expect(data).toMatchSnapshot();
  });
});
