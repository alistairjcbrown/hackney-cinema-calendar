export type Venue = {
  id: string;
  name: string;
  url: string;
  address: string;
  geo: string;
};

type Person = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
};

type Overview = {
  actors: string[];
  categories: string[];
  directors: string[];
  certification: string;
  duration: number;
  year: string;
};

export type Showing = {
  id: string;
  title?: string;
  overview: Overview;
  url: string;
  venueId: string;
};

export type MoviePerformance = {
  bookingUrl: string;
  showingId: string;
  time: number;
  notes?: string;
  screen?: string;
};

export type Movie = {
  id: string;
  title: string;
  normalizedTitle: string;
  isUnmatched?: boolean;
  certification?: string;
  overview?: string;
  year?: string;
  duration?: number;
  directors?: Person["id"][];
  actors?: Person["id"][];
  genres?: Genre["id"][];
  imdbId?: string;
  youtubeTrailer?: string;
  posterPath?: string;
  showings: Record<string, Showing>;
  performances: MoviePerformance[];
};

export type CinemaData = {
  venues: Record<string, Venue>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
  movies: Record<string, Movie>;
};

export type DateRange = {
  start: number;
  end: number;
};

export type Filters = {
  searchTerm: string;
  dateRange: DateRange;
  filteredVenues: Record<Venue["id"], boolean>;
  filteredGenres: Record<Genre["id"], boolean>;
};
