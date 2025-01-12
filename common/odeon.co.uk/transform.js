const ocapiv1Transform = require("../ocapi-v1/transform");

async function transform(attributes, showtimeDays) {
  const getBookingUrl = ({ id }) =>
    `${attributes.domain}/ticketing/seat-picker/?showtimeId=${id}`;
  return ocapiv1Transform(attributes, showtimeDays, { getBookingUrl });
}

module.exports = transform;
