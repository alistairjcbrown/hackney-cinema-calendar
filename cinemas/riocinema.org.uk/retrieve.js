const { domain } = require("./attributes");

const variables = {
  limit: 1000,
  orderBy: "magic",
  type: "all-published",
};

const query = `
query ($limit: Int, $orderBy: String, $type: String) {
  movies(
    limit: $limit
    orderBy: $orderBy
    type: $type
  ) {
    data {
      id
      name
      showingStatus
      urlSlug
      posterImage
      bannerImage
      synopsis
      starring
      directedBy
      producedBy
      searchTerms
      duration
      genre
      allGenres
      rating
      trailerYoutubeId
      trailerVideo
      releaseDate
      dateOfFirstShowing
      tmdbPopularityScore
      tmdbId
      dcmEdiMovieId
      dcmEdiMovieName
      siteId
      titleClassId

      showings {
        id
        time
        ticketsSold
        screenId
        seatsRemaining
      }
    }
  }
}
`;

async function retrieve() {
  const response = await fetch(`${domain}/graphql`, {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers: {
      "Content-Type": "application/json",
      "client-type": "consumer",
      cookie:
        "site_id=eyJfcmFpbHMiOnsibWVzc2FnZSI6IklqZzBJZz09IiwiZXhwIjpudWxsLCJwdXIiOiJjb29raWUuc2l0ZV9pZCJ9fQ%3D%3D--b2a709f2d1108f60815925874c749345955bd5a3",
    },
  });

  return await response.json();
}

module.exports = retrieve;
