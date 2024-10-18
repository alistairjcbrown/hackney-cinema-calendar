const path = require("node:path");
const fs = require("node:fs");

function getSites() {
  const srcpath = path.join(".", "cinemas");
  return fs
    .readdirSync(srcpath)
    .filter((file) => fs.statSync(path.join(srcpath, file)).isDirectory());
}

module.exports = getSites;
