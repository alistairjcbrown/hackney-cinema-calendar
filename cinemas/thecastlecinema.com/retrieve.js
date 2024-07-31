async function retrieve(url = "https://thecastlecinema.com/calendar/") {
  const response = await fetch(url);
  return await response.text();
}

module.exports = retrieve;
