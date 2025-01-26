import type { FavouriteMovie } from "@/types";
import { safelyJsonParse, safelyJsonStringify } from "@/utils/json-handling";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

const UserSettingsContext = createContext<{
  favouriteMovies: FavouriteMovie[];
  setFavouriteMovies: Dispatch<SetStateAction<FavouriteMovie[]>>;
}>({
  favouriteMovies: [],
  setFavouriteMovies: () => {},
});

export const useUserSettings = () => useContext(UserSettingsContext);

const favouriteMoviesKey = "favourite-movies";

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const favouriteMoviesValue = localStorage.getItem(favouriteMoviesKey);
  const persistedFavouriteMovies = safelyJsonParse(
    favouriteMoviesValue ?? "[]",
  ) as FavouriteMovie[];
  const [favouriteMovies, setFavouriteMovies] = useState<FavouriteMovie[]>(
    persistedFavouriteMovies ?? [],
  );

  const setFavouriteMoviesPersisted = (
    favouriteMovies: SetStateAction<FavouriteMovie[]>,
  ) => {
    const favouriteMoviesValue = safelyJsonStringify(favouriteMovies) ?? "";
    localStorage.setItem(favouriteMoviesKey, favouriteMoviesValue);
    return setFavouriteMovies(favouriteMovies);
  };

  return (
    <UserSettingsContext.Provider
      value={{
        favouriteMovies,
        setFavouriteMovies: setFavouriteMoviesPersisted,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}
