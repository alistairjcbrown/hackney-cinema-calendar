import type { CinemaData } from "@/types";
import { type Compressed, decompress } from "compress-json";
import slugify from "@sindresorhus/slugify";
import MoviePageContent from "./content";
import compressedData from "../../../../../public/combined-data.json";

export async function generateStaticParams() {
  const data = decompress(compressedData as Compressed) as CinemaData;
  const movies = Object.values(data.movies);
  return movies.map(({ id, title }) => ({ id, slug: slugify(title) }));
}

export default function MoviePage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  return <MoviePageContent params={params} />;
}
