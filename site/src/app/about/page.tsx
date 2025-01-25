import type { Metadata } from "next";
import About from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `London Cinema Movies - About`,
  };
}

export default function ShowingsRedirect() {
  return <About />;
}
