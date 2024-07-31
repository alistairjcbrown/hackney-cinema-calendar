const fs = require("node:fs");
const path = require("node:path");
const { format } = require("date-fns");

function getPath(filename) {
  const suffix = format(new Date(), "yyyy-MM-dd");
  return path.join(".", "cache", `${filename}-${suffix}`);
}

function checkCache(filename) {
  return fs.existsSync(getPath(filename));
}

function readCache(filename) {
  const data = fs.readFileSync(getPath(filename), "utf8");
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

function writeCache(filename, value) {
  let data;
  try {
    data = JSON.stringify(value, null, 2);
  } catch (e) {
    data = value;
  }
  fs.writeFileSync(getPath(filename), data);
}

async function dailyCache(key, retrieve) {
  let data;
  if (checkCache(key)) {
    data = readCache(key);
  } else {
    data = await retrieve();
    writeCache(key, data);
  }
  return data;
}

module.exports = dailyCache;
