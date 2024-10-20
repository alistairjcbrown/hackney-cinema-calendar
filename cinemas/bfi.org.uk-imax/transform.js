const attributes = require("./attributes");
const bfiTransform = require("../../common/bfi.org.uk/transform");

async function transform(data) {
  return bfiTransform(attributes, data);
}

module.exports = transform;
