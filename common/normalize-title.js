const knownRemovablePhrases = require("./known-removable-phrases.json");

function normalizeTitle(title) {
  title = title.toLowerCase();

  const removablePrefixes = [
    "Scared To Dance -",
    "Hitchcock: The Gainsborough Days -",
    "Bar Screening x Muse:",
    "Kung Fu Cinema:",
    "Preview Screening of",
  ];

  removablePrefixes.forEach((phrase) => {
    title = title.replace(phrase.toLowerCase(), "");
  });

  const hasPresents = title.match(/\s+presents?:?\s+(.*?)$/i);
  if (hasPresents) {
    title = hasPresents[1];
  }

  const hasPresented = title.match(/^(.*?)\s+presented\s+/i);
  if (hasPresented) {
    title = hasPresented[1];
  }

  const hasSeparator = title.match(/^(.*?)\s+(?:\+|\-|•)\s*/);
  if (hasSeparator) {
    title = hasSeparator[1];
  }

  const hasSquareBracketDate = title.trim().match(/^(.*?)\[(\d{4})\](.*?)$/);
  if (hasSquareBracketDate) {
    title = `${hasSquareBracketDate[1]}(${hasSquareBracketDate[2]})${hasSquareBracketDate[3]}`;
  }

  const hasBrackets = title.match(/^(.*?)\s+\[/);
  if (hasBrackets) {
    title = hasBrackets[1];
  }

  knownRemovablePhrases.forEach((phrase) => {
    title = title.replace(phrase.toLowerCase(), "");
  });

  const hasYear = title.trim().match(/\(\d{4}\)$/);
  if (!hasYear) {
    title = title.replace(/\([^(]*\)$/, "").trim();
    title = title.replace(/\([^(]*\)$/, "").trim(); // Do it twice in case there's more paraenthesis
  }

  return title
    .replace(/\s*:\s+/g, ": ")
    .trim()
    .replace(/:$/, "")
    .replace(/'|’/g, "")
    .replace(/\s+(-|–)(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = normalizeTitle;
