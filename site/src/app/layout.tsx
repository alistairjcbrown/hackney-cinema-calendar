"use client";
import { CinemaDataProvider, GetCinemaData } from "@/state/cinema-data-context";
import { FiltersProvider } from "@/state/filters-context";
import "rsuite/dist/rsuite.min.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CinemaDataProvider>
          <GetCinemaData>
            <FiltersProvider>{children}</FiltersProvider>
          </GetCinemaData>
        </CinemaDataProvider>
      </body>
    </html>
  );
}
