async function retrieve(url = "https://www.genesiscinema.co.uk/whatson") {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-1");
  return decoder.decode(buffer);
}

module.exports = retrieve;
