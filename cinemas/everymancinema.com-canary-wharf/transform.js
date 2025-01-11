const attributes = require("./attributes");
const everymanTransform = require("../../common/everymancinema.com/transform");

async function transform(data) {
  return everymanTransform(attributes, data);
}

module.exports = transform;
