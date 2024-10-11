async function retrieve(url = "https://princecharlescinema.com/whats-on/") {
  const response = await fetch(url);
  return await response.text();
}

module.exports = retrieve;
