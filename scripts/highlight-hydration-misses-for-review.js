const path = require("node:path");
const getSites = require("../common/get-sites");
const normalizeTitle = require("../common/normalize-title");

const termsExpectedToNotMatch = [
  // Multiple films
  /All\-Nighter/i,
  /Marathon/i,
  /Double Feature/i,
  /Trilogy/i,
  /Mystery Movie/i,

  // Non feature film events
  /Comedy Night/i,
  /\s+Comedy$/i,
  /Concert/i,
  /Quiz/i,
  /Filmmakers.*?Club/i,
  /TV Preview:/i,
  /short Film/i,
  / shorts: /i,
  /^Behind the Scenes:/i,
  /^Member Exclusive: .* Tour$/i,
  /Session \d+/i,
  /Season \d+/i,
  /Programme \d+/i,
  /Live in 3D/i,
  /New Writings/i,
  /Lecture:/i,
  /Animation Workshop/i,
  /Poetry Slam/i,
  / in conversation/i,
  /Stunt Saturday/i,
  /the art of /i,

  // Comunity events
  /Library Talk/i,
  /Library Research Session/i,
  /Women’s Voices Forum/i,
  /Free Talk:/i,
  /Raising Awareness of/i,

  // Film festival
  /Opening Gala/i,
  /Film Awards/i,

  // Live recordings
  /^NT Live:/i,
  /^RBO[^:]*:/i,
  /^The Royal Ballet:/i,
  /^Met Opera[^:]*:/i,
  /^The Metropolitan Opera:/i,
  /^The Royal Opera:/i,
  /^MACBETH:/i,
  /EXHIBITION ON SCREEN:/i,
  /^Play for Today:/i,
  /^Performance:/i,

  // Music
  /at The Ritzy/i,
  /Live Sessions/i,
  /Pitchblack Playback/i,
  /Dub Me Always:/i,
  /Your Gospel Night/i,
  /Funky Stuff/i,
  /Vinyl Sisters/i,
];

const expectedMatch = ({ title }) => {
  const notExpectedToMatch = termsExpectedToNotMatch.some(
    (term) => !!title.toLowerCase().match(term),
  );
  if (notExpectedToMatch) return false;
  return true;
};

const data = getSites().reduce(
  (mapping, site) => ({
    ...mapping,
    [site]: require(path.join(__dirname, "..", "output", `${site}-shows.json`)),
  }),
  {},
);

const flaggedForReview = {};
Object.keys(data).forEach((site) => {
  const siteData = data[site];
  siteData.forEach((show) => {
    if (!show.moviedb && expectedMatch(show)) {
      flaggedForReview[show.title] = flaggedForReview[show.title] || [];
      flaggedForReview[show.title].push({ site, show });
    }
  });
});

Object.keys(flaggedForReview).forEach((key, index) => {
  const matches = flaggedForReview[key];
  const normalizedTitle = normalizeTitle(key);
  const year = matches[0].show.overview.year;
  console.log(`${index + 1}. "${normalizedTitle}"${year ? ` (${year})` : ""}`);
  console.log(`    - Original: "${key}"`);
  console.log(
    `    - Search for matches: https://www.themoviedb.org/search/movie?query=${encodeURIComponent(normalizedTitle)}`,
  );
  console.log(`    - Source: ${matches[0].show.url}`);
  console.log(" ");
});
