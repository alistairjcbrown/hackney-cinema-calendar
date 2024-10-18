# 📆 Hackney Cinema Calendar

Automatically generated calendar of events at:

- 📍
  [Genesis Cinema](http://maps.google.com/maps?q=Genesis%20Cinema+%4051.52128726645794,-0.051143457671891594)
- 📍
  [Finsbury Park Picturehouse](http://maps.google.com/maps?q=Finsbury%20Park%20Picturehouse+%4051.565450891883124,-0.10763842328655573)
- 📍
  [Hackney Picturehouse](http://maps.google.com/maps?q=Hackney%20Picturehouse+%4051.54474966715274,-0.055025638908993514)
- 📍
  [Prince Charles Cinema](http://maps.google.com/maps?q=Prince%20Charles%20Cinema+%4051.51149384362524,-0.130186840699272)
- 📍
  [Rio Cinema](http://maps.google.com/maps?q=Rio%20Cinema+%4051.54970097438604,-0.07550473771574956)
- 📍
  [The Castle Cinema](http://maps.google.com/maps?q=The%20Castle%20Cinema+%4051.551469526266004,-0.043262315294576796)

Cinema listings from:

- 🌐 https://www.genesiscinema.co.uk
- 🌐 https://www.picturehouses.com/cinema/finsbury-park
- 🌐 https://www.picturehouses.com/cinema/hackney-picturehouse
- 🌐 https://princecharlescinema.com
- 🌐 https://www.riocinema.org.uk
- 🌐 https://thecastlecinema.com

The latest calendar files are available at:

- 📅
  [genesiscinema.co.uk-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/genesiscinema.co.uk-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/genesiscinema.co.uk-calendar.ics))
- 📅
  [picturehouses.com-finsbury-park-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-finsbury-park-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-finsbury-park-calendar.ics))
- 📅
  [picturehouses.com-hackney-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-hackney-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/picturehouses.com-hackney-calendar.ics))
- 📅
  [princecharlescinema.com-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/princecharlescinema.com-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/princecharlescinema.com-calendar.ics))
- 📅
  [riocinema.org.uk-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/riocinema.org.uk-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/riocinema.org.uk-calendar.ics))
- 📅
  [thecastlecinema.com-calendar.ics](https://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/thecastlecinema.com-calendar.ics)
  ([Google Calendar](https://calendar.google.com/calendar/render?cid=http://github.com/alistairjcbrown/hackney-cinema-calendar/releases/latest/download/thecastlecinema.com-calendar.ics))

## ⚙️ How to use

The URLs above always points to the latest calendar data. Add them to your
calendar application of choice to see the latest events. There are links for
Google Calendar and Webcal for calendar apps that support it.

## 🎟 Releases

Releases are run automatically early every morning, but may also be run manually
as part of testing or to gather the most up to date information during the day.

All releases can be seen at
https://github.com/alistairjcbrown/hackney-cinema-calendar/releases, with the
latest release showing the `latest` tag.

**Details of current releases:**

- Releases use git tags in the format `{date}.{suffix}`.
- Releases contain 3 types of file
  - The calendar files; e.g. `princecharlescinema.com-calendar.ics`
    - 💡 This is what most users will want!
    - Event data formatted in a way that can be used in your calendar
  - The data files; e.g. `princecharlescinema.com-shows.json`,
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
