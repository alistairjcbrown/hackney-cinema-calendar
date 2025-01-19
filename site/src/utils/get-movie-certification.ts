import { Certification, certificationOrder, type Movie } from "@/types";

const getMovieCertification = ({
  certification,
  showings,
}: Movie): Certification => {
  if (certification) return certification;

  const certificationsFromShowings = Object.values(showings).reduce(
    (showingCertifications, { overview }) =>
      overview.certification &&
      certificationOrder.includes(overview.certification as Certification)
        ? showingCertifications.add(overview.certification as Certification)
        : showingCertifications,
    new Set<Certification>(),
  );

  if (certificationsFromShowings.size === 1) {
    return [...certificationsFromShowings][0].toUpperCase() as Certification;
  }

  return Certification.Unknown;
};

export default getMovieCertification;
