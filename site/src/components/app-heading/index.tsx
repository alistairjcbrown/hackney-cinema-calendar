import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Header from "rsuite/cjs/Header";
import Nav from "rsuite/cjs/Nav";
import Stack from "rsuite/cjs/Stack";
import { useFilters } from "@/state/filters-context";
import "./styles.scss";
import { Filters } from "@/types";

export default function AppHeading({
  children = null,
}: {
  children?: ReactNode;
}) {
  const router = useRouter();
  const { defaultFilters, setFilters } = useFilters();

  return (
    <Header className="filter-header">
      <Stack direction="column" spacing={18}>
        <Stack.Item style={{ width: "100%" }}>
          <Nav
            onSelect={(eventKey) => {
              setFilters({ ...(defaultFilters as Filters) });
              router.push(eventKey);
            }}
          >
            <Nav.Item eventKey="/">Home</Nav.Item>
            <Nav.Item eventKey="/showings?/today/near-me">
              Showings near me
            </Nav.Item>
            <Nav.Item eventKey="/about">About</Nav.Item>
          </Nav>
        </Stack.Item>
        <Stack.Item style={{ width: "100%" }}>{children}</Stack.Item>
      </Stack>
    </Header>
  );
}
