const { parse } = require("date-fns");
const { enGB } = require("date-fns/locale/en-GB");
const {
  convertToList,
  parseMinsToMs,
  sanitizeRichText,
} = require("../../common/utils");
const { domain } = require("./attributes");

async function transform(movieData, sourcedEvents) {
  const movies = movieData.Events.map((movie) => {
    return {
      title: sanitizeRichText(movie.Title),
      url: movie.URL,
      overview: {
        duration: parseMinsToMs(movie.RunningTime),
        certification: movie.Rating.match(/bbfc\/lrg\/([^.]+)\./)[1],
        categories: [],
        directors: convertToList(movie.Director),
        actors: convertToList(movie.Cast),
      },
      performances: movie.Performances.map((performance) => {
        const date = parse(
          `${performance.StartDate}T${performance.StartTimeAndNotes}`,
          "yyyy-MM-dd'T'HH:mm",
          new Date(),
          {
            locale: enGB,
          },
        );

        let notes = "";
        // Baby-friendly screening
        if (performance.BF.toLowerCase() === "y") {
          notes += `\nBaby Friendly`;
        }
        // Audio described
        if (performance.AD.toLowerCase() === "y") {
          notes += `\nAudio described`;
        }
        // Hard of hearing subtitles
        if (performance.HOH.toLowerCase() === "y") {
          notes += `\nClosed Captioned screening for Hard of Hearing`;
        }
        // Relaxed screening
        if (performance.RS.toLowerCase() === "y") {
          notes += `\nRelaxed screening`;
        }
        // Q+A
        if (performance.QA.toLowerCase() === "y") {
          notes += `\nThis screening will be followed by a Q&A`;
        }
        // Accessible screening
        if (performance.AS.toLowerCase() === "y") {
          notes += `\nAccessible screening`;
        }
        if (performance.TP.toLowerCase() === "y") {
          notes += `\nTalking Pictures: A friendly film discussion group for seniors`;
        }
        // "IsSoldOut": "N",
        if (performance.IsSoldOut.toLowerCase() === "y") {
          notes += `\nSold out`;
        }

        return {
          time: date.getTime(),
          notes: notes.trim(),
          bookingUrl: `${domain}/TheLexiCinema.dll/${performance.URL}`,
          screen: performance.AuditoriumName.toLowerCase()
            .replace("screen", "")
            .trim(),
        };
      }),
    };
  });

  const listOfSourcedEvents = Object.values(sourcedEvents).flatMap(
    (events) => events,
  );
  return movies.concat(listOfSourcedEvents);
}

module.exports = transform;
