const attributes = require("./attributes");
const curzonTransform = require("../../common/curzon.com/transform");

async function transform(data) {
  return curzonTransform(attributes, data);
}

module.exports = transform;
