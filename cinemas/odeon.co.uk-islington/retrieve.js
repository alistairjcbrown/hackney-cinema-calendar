const attributes = require("./attributes");
const curzonRetrieve = require("../../common/odeon.co.uk/retrieve");

async function retrieve() {
  return curzonRetrieve(attributes);
}

module.exports = retrieve;
