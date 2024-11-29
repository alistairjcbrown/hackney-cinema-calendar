import type { Movie } from "@/types";
import Divider from "rsuite/cjs/Divider";

export default function Summary({ movies }: { movies: Movie[] }) {
  return <Divider>{Object.keys(movies).length} movies</Divider>;
}
