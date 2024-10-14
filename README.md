# 📆 Hackney Cinema Calendar

Automatically generated calendar of events at
[Genesis Cinema](https://maps.app.goo.gl/tZHmxdPQJvXMdLvp8),
[Hackney Picturehouse](https://maps.app.goo.gl/jvF1xUkQsoJnHoeZA),
[Prince Charles Cinema](https://maps.app.goo.gl/PHF1xWvKAYhS6vPCA),
[Rio Cinema](https://maps.app.goo.gl/ADne8QJKvNvjrbp46), and
[The Castle Cinema](https://maps.app.goo.gl/Y4Nu2SEaaRo9TEpn9)

Data retrieved from: https://genesiscinema.co.uk,
https://www.picturehouses.com/cinema/hackney-picturehouse,
https://princecharlescinema.com, https://www.riocinema.org.uk, and
https://thecastlecinema.com

The latest calendar files are available at:

- https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/genesiscinema.co.uk-calendar.ics
- https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-calendar.ics
- https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/princecharlescinema.com-calendar.ics
- https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/riocinema.org.uk-calendar.ics
- https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/thecastlecinema.com-calendar.ics

## ⚙️ How to use

The URLs above always points to the latest calendar data. Add them to your
calendar application of choice to see the latest events.

### Google Calendar

ℹ️ Instructions below modified from
https://support.google.com/calendar/answer/37100?co=GENIE.Platform%3DDesktop&oco=1

1. On your computer, open [Google Calendar](https://calendar.google.com/).
2. On the left, next to "Other calendars," click "Add" or "+" and then "From
   URL".
3. Paste in one of the following (depending on which events you want to see)
   - `https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/genesiscinema.co.uk-calendar.ics`
   - `https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-calendar.ics`
   - `https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/princecharlescinema.com-calendar.ics`
   - `https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/riocinema.org.uk-calendar.ics`
   - `https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/thecastlecinema.com-calendar.ics`
4. Click "Add calendar". The calendar appears on the left, under "Other
   calendars."
5. Repeat as necessary for any other cinema calendars

ℹ️ **Note:** It might take up to 12 hours for changes to show in your Google
Calendar.

## 🎟 Releases

Releases are run automatically early every morning, but may also be run manually
as part of testing or to gather the most up to date information during the day.

All releases can be seen at
https://github.com/alistairjcbrown/hackney-cinema-calendar/releases, with the
latest release showing the `latest` tag.

Details of current releases:

- Releases use git tags in the format `{date}.{suffix}`.
- Releases contain 3 types of file
  - The calendar files; `genesiscinema.co.uk-calendar.ics`,
    `picturehouses.com-calendar.ics`, `princecharlescinema.com-calendar.ics`,
    `riocinema.org.uk-calendar.ics`, `thecastlecinema.com-calendar.ics`
    - 💡 This is what most users will want!
    - Event data formatted in a way that can be used in your calendar
  - The data files; ; `genesiscinema.co.uk-shows.json`,
    `picturehouses.com-shows.json`, `princecharlescinema.com-shows.json`,
    `riocinema.org.uk-shows.json`, `thecastlecinema.com-shows.json`
    - Contains all of the data extracted from each site (title, performances
      information, notes, booking URL, etc.)
    - Used to generate the calendar file above
  - The JSON schema file, `schema.json`
    - Provides a schema of the information expected in each of the JSON files
    - JSON files in this release will have been validated against the schema as
      part of the release process

⚠️ The details above are the current state - however, this may not have always
been the case, and may not always be the case going forward. Please do not rely
on this information for any historical releases!
