const attributes = require("./attributes");
const electriccinemaTransform = require("../../common/electriccinema.co.uk/transform");

async function transform(data) {
  return electriccinemaTransform(attributes, data);
}

module.exports = transform;
