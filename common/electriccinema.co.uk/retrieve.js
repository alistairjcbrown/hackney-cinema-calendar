async function retrieve({ url }) {
  const response = await fetch(url);
  const site = await response.text();
  const [, data] = site.match(
    /\/*\s+<!\[CDATA\[\s+\*\/\s+var\s+electric\s+=\s+(.+?);\s+\/\*\s+\]\]>\s+\*\//i,
  );
  return JSON.parse(data);
}

module.exports = retrieve;
