import type { Movie } from "@/types";
import Divider from "rsuite/cjs/Divider";
import showNumber from "@/utils/show-number";

export default function Summary({ movies }: { movies: Movie[] }) {
  return <Divider>{showNumber(Object.keys(movies).length)} movies</Divider>;
}
