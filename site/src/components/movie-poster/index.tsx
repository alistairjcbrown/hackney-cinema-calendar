import type { Movie } from "@/types";
import Image from "next/image";
import { getContrastingColor } from "contra-color";
import stringToColor from "string-to-color";
import "./index.scss";

const NoPoster = ({
  title,
  width,
  height,
}: {
  title: string;
  width: number;
  height: number;
}) => {
  const background = stringToColor(`${title}`);
  const { color } = getContrastingColor(background);
  const { color: shadow } = getContrastingColor(color);
  return (
    <div className="no-poster">
      <div
        className="no-poster-background"
        style={{ background, width, height }}
      ></div>
      <div
        className="no-poster-text"
        style={{ color, filter: `drop-shadow(0 0 0.5rem ${shadow})` }}
      >
        {title}
      </div>
    </div>
  );
};

export default function MoviePoster({
  movie: { isUnmatched, posterPath, title },
  width = 171,
  height = 260,
}: {
  movie: Movie;
  width?: number;
  height?: number;
}) {
  return (
    <div>
      <div className="movie-poster">
        {isUnmatched || !posterPath ? (
          <NoPoster title={title} width={width} height={height} />
        ) : (
          <Image
            unoptimized
            src={`https://image.tmdb.org/t/p/w${2 * width}${posterPath}`}
            alt={title}
            width={width}
            height={height}
          />
        )}
      </div>
    </div>
  );
}
