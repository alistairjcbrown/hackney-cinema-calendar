const attributes = require("./attributes");
const myvueTransform = require("../../common/myvue.com/transform");

async function transform(data) {
  return myvueTransform(attributes, data);
}

module.exports = transform;
