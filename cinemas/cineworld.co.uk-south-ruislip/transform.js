const attributes = require("./attributes");
const cineworldTransform = require("../../common/cineworld.co.uk/transform");

async function transform(data) {
  return cineworldTransform(attributes, data);
}

module.exports = transform;
