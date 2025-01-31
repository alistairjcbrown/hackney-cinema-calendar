const {
  sanitizeRichText,
  createPerformance,
  createOverview,
} = require("../../common/utils");
const { parseDate } = require("./utils");
const { domain } = require("./attributes");

function getNotesList(performance) {
  const notes = [];
  // Baby-friendly screening
  if (performance.BF.toLowerCase() === "y") {
    notes.push("Baby Friendly");
  }
  // Audio described
  if (performance.AD.toLowerCase() === "y") {
    notes.push("Audio described");
  }
  // Hard of hearing subtitles
  if (performance.HOH.toLowerCase() === "y") {
    notes.push("Closed Captioned screening for Hard of Hearing");
  }
  // Relaxed screening
  if (performance.RS.toLowerCase() === "y") {
    notes.push("Relaxed screening");
  }
  // Q+A
  if (performance.QA.toLowerCase() === "y") {
    notes.push("This screening will be followed by a Q&A");
  }
  // Accessible screening
  if (performance.AS.toLowerCase() === "y") {
    notes.push("Accessible screening");
  }
  // Talking Pictures
  if (performance.TP.toLowerCase() === "y") {
    notes.push(
      "Talking Pictures: A friendly film discussion group for seniors",
    );
  }
  // Sold Out
  if (performance.IsSoldOut.toLowerCase() === "y") {
    notes.push("Sold out");
  }
  return notes;
}

async function transform(movieData, sourcedEvents) {
  const movies = movieData.Events.map((movie) => {
    return {
      title: sanitizeRichText(movie.Title),
      url: movie.URL,
      overview: createOverview({
        duration: movie.RunningTime,
        classification: movie.Rating.match(/bbfc\/lrg\/([^.]+)\./)[1],
        directors: movie.Director,
        actors: movie.Cast,
      }),
      performances: movie.Performances.map((performance) =>
        createPerformance({
          date: parseDate(performance),
          notesList: getNotesList(performance),
          url: `${domain}/TheLexiCinema.dll/${performance.URL}`,
          screen: performance.AuditoriumName,
        }),
      ),
    };
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
