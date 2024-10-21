const attributes = require("./attributes");
const indycinemagroupTransform = require("../../common/indycinemagroup.com/transform");

async function transform(data) {
  return indycinemagroupTransform(attributes, data);
}

module.exports = transform;
