const {
  dailyCache,
  getCacheStats,
  clearCacheStats,
} = require("./common/cache");
const getModuleNamesFor = require("./common/get-module-names-for");

async function retrieveSource(source) {
  const { retrieve, attributes } = require(`./sources/${source}`);
  clearCacheStats();

  console.log(`[🗂️  Source: ${source}]`);
  process.stdout.write(` - Retriving data ...   `);
  let data;
  try {
    data = await dailyCache(attributes.cacheKey, () => retrieve());
    console.log(`\t✅ Retrieved`);
  } catch (e) {
    console.log(`\t❌ Error retriving`);
    throw e;
  }
  console.log(" ");

  const {
    hits: { length: hit },
    misses: { length: miss },
  } = getCacheStats();
  const percentage = Math.round((hit / (hit + miss)) * 100);
  console.log(`📊 ${percentage}% cache success (${hit} hits, ${miss} misses)`);
}

(async function () {
  const sources = getModuleNamesFor("sources");

  for (source of sources) {
    await retrieveSource(source);
    console.log("\n---\n");
  }
})();
