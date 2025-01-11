const metOperaprefixes = [
  /Met Opera Encore:/i,
  /Met Opera Live:/i,
  /Met Opera Season/i,
  /Met Opera:/i,
  /The Met:/i,
  /The Metropolitan Opera:/i,
];
const yearRangeMatcher = /(\d{2})\d{2}-(\d{2})/;
const shortYearRangeMatcher = /\d{2}-(\d{2})/;
const yearSuffixMatcher = /\(\d{4}\)$/;
const ownerMatcher = /:\s+[^\s]+['|’]s/;

function standardizePrefixingForTheatrePerformances(
  title,
  options = { retainYear: false },
) {
  const lowercaseTitle = title.toLowerCase();
  if (
    lowercaseTitle.startsWith("met opera") ||
    lowercaseTitle.startsWith("the met:") ||
    lowercaseTitle.startsWith("the metropolitan opera")
  ) {
    let updatedPrefixTitle = metOperaprefixes.reduce(
      (value, prefix) => value.replace(prefix, "The Metropolitan Opera: "),
      title,
    );

    updatedPrefixTitle = updatedPrefixTitle.replace(ownerMatcher, ":");

    const yearRangeMatch = updatedPrefixTitle.match(yearRangeMatcher);
    if (yearRangeMatch) {
      updatedPrefixTitle = `${updatedPrefixTitle.replace(yearRangeMatcher, "")} (${yearRangeMatch[1]}${yearRangeMatch[2]})`;
    }

    const shortYearRangeMatch = updatedPrefixTitle.match(shortYearRangeMatcher);
    if (shortYearRangeMatch) {
      updatedPrefixTitle = `${updatedPrefixTitle.replace(shortYearRangeMatcher, "")} (20${shortYearRangeMatch[1]})`;
    }

    if (!options.retainYear) {
      updatedPrefixTitle = updatedPrefixTitle.replace(yearSuffixMatcher, "");
    }
    return updatedPrefixTitle
      .replace(/live in hd/i, "")
      .replace(/\s+:\s+/, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return title;
}

module.exports = standardizePrefixingForTheatrePerformances;
