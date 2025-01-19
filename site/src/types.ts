export type Position = {
  lat: number;
  lon: number;
};

export type Venue = {
  id: string;
  name: string;
  url: string;
  address: string;
  geo: Position;
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

export enum Certification {
  Universal = "U",
  ParentalGuidance = "PG",
  Suitablefor12years = "12",
  Suitablefor12yearsAccompanied = "12A",
  Suitablefor15years = "15",
  Suitablefor18years = "18",
  Unknown = "Unknown",
}
export const certificationOrder: Certification[] = [
  Certification.Universal,
  Certification.ParentalGuidance,
  Certification.Suitablefor12years,
  Certification.Suitablefor12yearsAccompanied,
  Certification.Suitablefor15years,
  Certification.Suitablefor18years,
  Certification.Unknown,
];

export type Movie = {
  id: string;
  title: string;
  normalizedTitle: string;
  isUnmatched?: boolean;
  certification?: Certification;
  overview?: string;
  year?: string;
  releaseDate?: string;
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
  generatedAt: string;
  venues: Record<string, Venue>;
  people: Record<string, Person>;
  genres: Record<string, Genre>;
  movies: Record<string, Movie>;
};

export type DateRange = {
  start: number;
  end: number;
};

export type YearRange = {
  min: number;
  max: number;
};

export type Filters = {
  searchTerm: string;
  dateRange: DateRange;
  yearRange: YearRange;
  includeUnknownYears: boolean;
  filteredVenues: Record<Venue["id"], boolean>;
  filteredMovies: Record<Movie["id"], boolean>;
  filteredCertifications: Record<Certification, boolean>;
  filteredGenres: Record<Genre["id"], boolean>;
};
