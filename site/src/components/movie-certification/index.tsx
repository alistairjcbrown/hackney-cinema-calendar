import type { ComponentProps } from "react";
import type { Movie } from "@/types";
import Image from "next/image";
import bbfcU from "./images/BBFC_U_2019.svg";
import bbfcPg from "./images/BBFC_PG_2019.svg";
import bbfc12 from "./images/BBFC_12_2019.svg";
import bbfc12a from "./images/BBFC_12A_2019.svg";
import bbfc15 from "./images/BBFC_15_2019.svg";
import bbfc18 from "./images/BBFC_18_2019.svg";

const mapping: Record<string, ComponentProps<typeof Image>> = {
  u: bbfcU,
  pg: bbfcPg,
  "12": bbfc12,
  "12a": bbfc12a,
  "15": bbfc15,
  "18": bbfc18,
};

export default function MovieCertification({
  movie: { certification },
}: {
  movie: Movie;
}) {
  if (!certification) return null;
  const imageDetails = mapping[certification.toLowerCase().trim()];
  if (imageDetails)
    return (
      <Image
        src={imageDetails.src}
        width={50}
        height={50}
        alt={certification}
      />
    );
  return <span>[{certification}]</span>;
}
