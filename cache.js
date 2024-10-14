const fs = require("node:fs");
const path = require("node:path");
const { format } = require("date-fns");

function getPathDaily(filename) {
  const suffix = format(new Date(), "yyyy-MM-dd");
  return path.join(".", "cache", `${filename}-${suffix}`);
}

function checkCache(filename, getPath = getPathDaily) {
  return fs.existsSync(getPath(filename));
}

function readCache(filename, getPath = getPathDaily) {
  const data = fs.readFileSync(getPath(filename), "utf8");
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

function writeCache(filename, value, getPath = getPathDaily) {
  let data;
  try {
    data = JSON.stringify(value, null, 2);
  } catch (e) {
    data = value;
  }
  fs.writeFileSync(getPath(filename), data);
}

async function cache(key, retrieve, getPath = getPathDaily) {
  let data;
  if (checkCache(key, getPath)) {
    data = readCache(key, getPath);
  } else {
    data = await retrieve();
    writeCache(key, data, getPath);
  }
  return data;
}

module.exports = cache;
