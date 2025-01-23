const { domain } = require("./attributes");

async function retrieve() {
  const response = await fetch(`${domain}/whats-on/`);
  return await response.text();
}

module.exports = retrieve;
