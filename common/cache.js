const fs = require("node:fs");
const path = require("node:path");
const { format } = require("date-fns");

const cacheStats = {
  misses: [],
  hits: [],
};

function getCacheStats() {
  return cacheStats;
}

function clearCacheStats() {
  cacheStats.misses = [];
  cacheStats.hits = [];
}

function getCachePath(filename) {
  return path.join(".", "cache", filename);
}

function getPathDaily(filename) {
  const suffix = format(new Date(), "yyyy-MM-dd");
  return getCachePath(`${filename}-${suffix}`);
}

function checkCache(filename, getPath) {
  return fs.existsSync(getPath(filename));
}

function readCache(filename, getPath) {
  const data = fs.readFileSync(getPath(filename), "utf8");
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

function writeCache(filename, value, getPath) {
  let data;
  try {
    data = JSON.stringify(value, null, 2);
  } catch (e) {
    data = value;
  }
  fs.writeFileSync(getPath(filename), data);
}

async function cache(key, retrieve, getPath = getCachePath) {
  let data;
  if (checkCache(key, getPath)) {
    data = readCache(key, getPath);
    cacheStats.hits.push(key);
  } else {
    data = await retrieve();
    writeCache(key, data, getPath);
    cacheStats.misses.push(key);
  }
  return data;
}

function dailyCache(key, retrieve) {
  return cache(key, retrieve, getPathDaily);
}

module.exports = {
  clearCacheStats,
  getCacheStats,
  getCachePath,
  cache,
  dailyCache,
};