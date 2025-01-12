const attributes = require("./attributes");
const curzonTransform = require("../../common/odeon.co.uk/transform");

async function transform(data) {
  return curzonTransform(attributes, data);
}

module.exports = transform;
