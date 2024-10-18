const attributes = require("./attributes");
const picturehousesTransform = require("../../common/picturehouses.com/transform");

async function transform(data) {
  return picturehousesTransform(attributes, data);
}

module.exports = transform;
